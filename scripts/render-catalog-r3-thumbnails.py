"""Render the approved package meshes to catalog thumbnails with Pillow."""
import json
import math
import struct
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "src/data/catalog-r3-packages.json"
WIDTH = 352
HEIGHT = 244
SCALE = 2


def vector_dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def read_glb(path):
    data = path.read_bytes()
    json_size, = struct.unpack_from("<I", data, 12)
    glb = json.loads(data[20:20 + json_size])
    buffer_start = 28 + json_size

    def values(index):
        accessor = glb["accessors"][index]
        view = glb["bufferViews"][accessor["bufferView"]]
        offset = buffer_start + view["byteOffset"] + accessor.get("byteOffset", 0)
        entry = struct.Struct("<fff" if accessor["type"] == "VEC3" else "<H")
        return [
            entry.unpack_from(data, offset + i * entry.size)
            for i in range(accessor["count"])
        ]

    for mesh in glb["meshes"]:
        for primitive in mesh["primitives"]:
            positions = values(primitive["attributes"]["POSITION"])
            normals = values(primitive["attributes"]["NORMAL"])
            indices = [i[0] for i in values(primitive["indices"])]
            color = glb["materials"][primitive["material"]]["pbrMetallicRoughness"]["baseColorFactor"][:3]
            for start in range(0, len(indices), 3):
                corners = indices[start:start + 3]
                yield [positions[i] for i in corners], [normals[i] for i in corners], color


def render(source, target):
    yaw = math.radians(30)
    pitch = math.radians(25)
    sine, cosine = math.sin(yaw), math.cos(yaw)
    up = (sine * -math.sin(pitch), math.cos(pitch), cosine * -math.sin(pitch))
    right = (cosine, 0, -sine)
    toward = (sine * math.cos(pitch), math.sin(pitch), cosine * math.cos(pitch))
    light = (-0.42, 0.81, 0.41)
    triangles = []
    for corners, normals, color in read_glb(source):
        normal = tuple(sum(column) / 3 for column in zip(*normals))
        if vector_dot(normal, toward) < -0.001:
            continue
        xy = [(vector_dot(p, right), -vector_dot(p, up)) for p in corners]
        brightness = 0.53 + 0.47 * max(0, vector_dot(normal, light))
        rgb = tuple(round(255 * min(1, 0.035 + (component * brightness) ** (1 / 2.2))) for component in color)
        triangles.append((sum(vector_dot(p, toward) for p in corners), xy, rgb))

    xs, ys = zip(*(point for _, triangle, _ in triangles for point in triangle))
    center_x, center_y = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    fit = min((WIDTH - 76) / (max(xs) - min(xs)), (HEIGHT - 42) / (max(ys) - min(ys)))
    image = Image.new("RGBA", (WIDTH * SCALE, HEIGHT * SCALE))
    canvas = ImageDraw.Draw(image)
    for _, triangle, rgb in sorted(triangles, key=lambda t: t[0]):
        canvas.polygon([
            ((WIDTH / 2 + (x - center_x) * fit) * SCALE,
             (HEIGHT / 2 + (y - center_y) * fit) * SCALE)
            for x, y in triangle
        ], fill=rgb + (255,))
    image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(target, "WEBP", quality=91)


if __name__ == "__main__":
    revision = sys.argv[1] if len(sys.argv) > 1 else "r3"
    manifest = MODELS.with_name(f"catalog-{revision}-packages.json")
    for package, source in json.loads(manifest.read_text(encoding="utf-8")).items():
        render(ROOT / ("public" + source["file"]), ROOT / f"public/component-catalog/{revision}-{package}.webp")
