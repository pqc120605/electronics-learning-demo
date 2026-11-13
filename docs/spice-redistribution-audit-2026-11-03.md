# Ngspice WASM: kiểm kê provenance và release gate — 03/11/2026

## Kết quả hiện tại

Artifact đang được Vite phục vụ từ `public/vendor/eecircuit-engine/spice.wasm`:

- Package npm `eecircuit-engine` 1.8.0, wrapper khai báo MIT.
- Runtime trả header ngspice 45.2, build header `Sat Sep 5 01:00:10 UTC 2026`.
- 6,133,055 bytes; SHA-256 `ed7995425b6f7af02db874539d13ea10d07759d5f2be6b79969343459ae886e4`.
- `node_modules/eecircuit-engine/package.json` chỉ phát hành thư mục `dist`; package đã cài không có source ngspice, build script hoặc component manifest gắn với chính hash này. npm registry metadata của `eecircuit-engine@1.8.0` báo wrapper `gitHead` là `f4dab6458d3865a1db9766008480690d23410c3a`, nhưng archive của đúng commit này khai báo package version `1.7.0`, khác bản npm đang cài `1.8.0`. Vì vậy metadata này chưa đủ tin cậy để nối source wrapper với artifact 1.8.0 và cũng không xác định ngspice source commit.
- `Simulation` chạy smoke test chia áp 5 V, kết quả mong đợi 2,5 V. Đây là xác minh kỹ thuật/hash, không phải xác minh quyền phân phối.

## Chưa đủ bằng chứng để kết luận quyền

MIT của package wrapper không chứng minh các file đã biên dịch vào WASM đều là MIT. Tài liệu upstream mô tả các license/nghĩa vụ theo thành phần; manual hiện tại có version 47+ và không phải build manifest của runtime 45.2 này. Repository upstream hoặc script build ở nhánh hiện hành cũng không chứng minh package 1.8.0 được tạo từ cùng revision/cờ build. Vì vậy không thể kết luận artifact cụ thể được phép hay bị cấm phân phối.

Trước khi phát hành công khai cần khớp đủ: ngspice source commit/tag và patch với hash WASM; build recipe, flags, compiler/toolchain; inventory thành phần/mã đã link và license từng phần; các NOTICE/source/relink materials bắt buộc; bằng chứng review áp dụng cho chính artifact này. Registry-reported wrapper gitHead chưa khớp version trong source archive và không thay thế provenance của ngspice core.

## Cổng phát hành trong repo

- `npm run audit:spice-engine`: kiểm tra wrapper/runtime/hash và giải một mạch DC; không xác nhận license.
- `npm run check:public-release`: hash lại WASM trên đúng public path và đối chiếu checksum/byte count với provenance; fail-closed nếu trạng thái, source commit khớp runtime, recipe/toolchain, inventory cấu trúc hoặc review gắn với cùng SHA-256 còn thiếu.
- `npm run build` và `npm run build:public`: đều chạy release gate trước khi tạo bản build có thể bị phát hành.
- `npm run build:local`: chỉ để kiểm tra nội bộ khi provenance còn thiếu. Kết quả vẫn chứa WASM tại đường dẫn public của Vite; không tải lên host, gửi cho người dùng hay coi là bản phát hành.

Khi có đủ hồ sơ, cập nhật `public/licenses/spice-engine-provenance.json` theo đúng artifact mới hoặc đã đối chiếu, chạy cả audit và `check:public-release`, rồi để người phụ trách phát hành xác nhận review trên đúng SHA-256. Không đổi `status` thành `cleared` chỉ để làm lệnh qua.

## Rà soát upstream bổ sung — 03/11/2026

- Repository upstream hiện hành có `build-ngspice.sh` và quy trình Docker, đồng thời ghi `build-meta.json` vào source package; `package.json` trên nhánh hiện hành đang ở 1.9.0. Đây là hướng hữu ích để lấy provenance khi dùng một artifact được build từ phiên bản/tag phù hợp.
- Không áp dụng thông tin đó cho binary hiện tại: project đang ghim `eecircuit-engine` 1.8.0; npm package đã cài chỉ có `dist/`, không có metadata/build recipe/source commit, và chưa có so khớp hash với output của một tag upstream cụ thể. Build script upstream hiện hành cũng không chứng minh runtime 45.2 trong WASM này được build bằng cùng source/cờ.
- **Kiểm tra source commit được npm registry báo:** archive `EEcircuit-engine` tại `f4dab6458d3865a1db9766008480690d23410c3a` có `package.json` version `1.7.0`, không phải version `1.8.0` đang cài. SHA-256 archive tải về để kiểm tra: `D7F6929395845D2D5872E9211C3C488E40D27BB01C7D180D602BD1BA23A7D076`. `build-ngspice.sh` gọi Docker; `Docker/run.sh` clone mirror, tự chọn latest `ngspice-X.Y` tag (hoặc `pre-master` branch), dùng Emscripten `latest`, tắt XSPICE/OSDI và áp patch; `build-meta.json` chỉ ghi `main` hoặc `next`. Không pin ngspice commit, Emscripten version, base image digest hay patch hash. Đây là bằng chứng script có thể thu hẹp thành phần bật trong build, nhưng không gắn script đó với WASM hash hiện có.
- Upstream `LICENSE` xác nhận điều khoản MIT của repository/wrapper. Nó không thay thế việc nhận diện code bên trong WASM hoặc các nghĩa vụ đi kèm ngspice và thành phần đã liên kết. Gate phát hành tiếp tục ở trạng thái **not-cleared**.
- Hướng khắc phục có thể tái lập: xin/thu thập build record gắn với hash `ed7995…886e4`, hoặc tự tạo artifact mới từ tag/source commit cụ thể, lưu `build-meta`, component inventory, notices/source obligations, rồi kiểm tra kỹ thuật và review phân phối artifact mới. npm metadata chỉ báo wrapper gitHead `f4dab6…10c3a`, và source archive bị lệch version; không phải provenance đáng tin cậy của ngspice core commit.

## Đối chiếu điều khoản upstream ngspice — 03/11/2026

- Trang developer chính thức mô tả code ngspice “with few exceptions” theo Modified BSD. Manual upstream hiện nêu ngoại lệ `tclspice` và `numparam` theo LGPLv2, XSPICE public domain, và OSDI theo MPL-2.0. Modified BSD cho phép phân phối binary khi giữ copyright, điều kiện và disclaimer trong tài liệu hoặc vật liệu đi kèm.
- Đây là căn cứ để biết loại nghĩa vụ cần kiểm tra, **không phải** danh sách thành phần được liên kết vào WASM đang dùng. Chưa có source commit/tag ngspice, patch set, compiler flags, toolchain pin hay bảng thành phần gắn với SHA-256 `ed7995…886e4`; chưa thể xác định ngoại lệ hoặc thư viện nào thật sự hiện diện.
- Kết luận không đổi: ngspice upstream nhìn chung được phân phối theo giấy phép permissive có điều kiện thông báo, nhưng quyền phân phối artifact WASM cụ thể của dự án vẫn **not-cleared** đến khi truy nguyên/rebuild đúng artifact và đóng các điều kiện NOTICE/inventory/review. Không cài thêm toolchain vì chưa có source revision/build recipe phù hợp để dựng lại chính hash này.
- Nguồn chính đã xem: [ngspice developer/license page](https://ngspice.sourceforge.io/devel.html) và [ngspice User’s Manual, chương 29](https://ngspice.sourceforge.io/docs/ngspice-manual.pdf).

## Nguồn tham khảo

- Ngspice User’s Manual upstream: <https://ngspice.sourceforge.io/docs/ngspice-manual.pdf>
- Ngspice developer/license information: <https://ngspice.sourceforge.io/devel.html>
- Ngspice COPYING: <https://github.com/ngspice/ngspice/blob/master/COPYING>
- `eecircuit-engine` upstream: <https://github.com/eelab-dev/EEcircuit-engine>
- Upstream build recipe: <https://github.com/eelab-dev/EEcircuit-engine/blob/main/build-ngspice.sh>
- Upstream wrapper license: <https://github.com/eelab-dev/EEcircuit-engine/blob/main/LICENSE>
- npm registry metadata for `eecircuit-engine@1.8.0`: <https://registry.npmjs.org/eecircuit-engine/1.8.0>
- Registry-reported wrapper commit archive: <https://github.com/eelab-dev/EEcircuit-engine/tree/f4dab6458d3865a1db9766008480690d23410c3a>

Các đường dẫn upstream hiện có thể thay đổi. Chỉ source/tag/build record gắn với hash cụ thể mới giúp kiểm tra thành phần binary này; các trang hiện hành là bối cảnh tham khảo, không thay thế provenance.
