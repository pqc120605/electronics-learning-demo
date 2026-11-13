from pathlib import Path
import json, math, struct

ROOT = Path(__file__).resolve().parents[3]
FILES = ('esp32-devkit-v1-30pin.glb', 'esp32-led-assembly.glb')


def multiply(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by,
            aw*by - ax*bz + ay*bw + az*bx,
            aw*bz + ax*by - ay*bx + az*bw,
            aw*bw - ax*bx - ay*by - az*bz]


half = math.sqrt(0.5)
legacy_model_rotation_inverse = [half, 0.0, 0.0, half]
for filename in FILES:
    path = ROOT / 'public' / 'models' / filename
    data = path.read_bytes()
    magic, version, _ = struct.unpack_from('<III', data, 0)
    json_length, json_type = struct.unpack_from('<II', data, 12)
    if magic != 0x46546C67 or version != 2 or json_type != 0x4E4F534A:
        raise ValueError(f'Unsupported GLB: {path}')
    document = json.loads(data[20:20 + json_length])
    cp2102 = [node for node in document['nodes'] if node.get('name') == 'U3']
    if len(cp2102) != 1 or len(cp2102[0].get('rotation', [])) != 4:
        raise ValueError(f'Expected one transformed CP2102 node U3 in {path}')
    corrected = multiply(cp2102[0]['rotation'], legacy_model_rotation_inverse)
    if all(abs(actual - expected) < 1e-6 for actual, expected in zip(cp2102[0]['rotation'], corrected)):
        raise ValueError(f'CP2102 rotation in {path} is not in the expected legacy orientation')
    if math.isclose(sum((actual - expected) ** 2 for actual, expected in zip(cp2102[0]['rotation'], [0.7071067811865476, 0.0, -0.7071067811865476, 0.0])), 0.0, abs_tol=1e-10):
        print(f'Already corrected: {filename}')
        continue
    cp2102[0]['rotation'] = corrected
    json_chunk = json.dumps(document, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    json_chunk += b' ' * ((-len(json_chunk)) % 4)
    binary_offset = 20 + json_length
    binary_length, binary_type = struct.unpack_from('<II', data, binary_offset)
    binary_chunk = data[binary_offset + 8:binary_offset + 8 + binary_length]
    output = struct.pack('<III', magic, version, 12 + 8 + len(json_chunk) + 8 + len(binary_chunk))
    output += struct.pack('<II', len(json_chunk), json_type) + json_chunk
    output += struct.pack('<II', len(binary_chunk), binary_type) + binary_chunk
    path.write_bytes(output)
    print(f'Corrected {filename}: quaternion={cp2102[0]["rotation"]}')
