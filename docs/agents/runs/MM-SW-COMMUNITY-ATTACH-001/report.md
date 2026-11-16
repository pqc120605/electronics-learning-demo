# Đính kèm và gói kết nối cộng đồng online

16/11/2026 · MM-SW-COMMUNITY-ATTACH-001

Xem trước/gỡ/tải ảnh và tệp;5tệp,10MiB/tệp,25MiB/bài; IndexedDB commit, bảo toàn nháp khi lỗi; adapter Supabase+SQL RLS/private bucket+hướng dẫn.

## Kiểm chứng

- typecheck exit0.
- npm.cmd test:680/680, exit0;52ca liên quan URL/board chạy lại sau sửa liên kết cuối, exit0.
- build:local exit0 (bản nội bộ).
- production-preview e2e toàn bộ:191/194, exit1; ba fixture/selector đã sửa, hai file liên quan chạy lại10/10 exit0 trên cùng bundle. Không tuyên bố194/194 trong một lượt. Dùng config kế thừa cổng5311 để giữ tiến trình khác ở5196. Không báo đã chạy lệnh chuẩn5196.
- Review độc lập:PASS, xem [review.md](review.md); hash source khớp snapshot đã review.

Lệnh/log/exitcode: [verification.json](verification.json). Bản quét đầu bị ngắt sau khi phát hiện hồi quy; kết quả source cũ không được dùng thay lượt cuối. Không thêm dependency, không deploy, không gọiClaude, không chạm hardware.

## Giới hạn

Chưa tạo backend. SQL apply, OAuth, upload thật, signed URL expiry, hai tài khoản/RLS và concurrency đều NOT_RUN. Không công bố online live. Tệp trước khi đăng chỉ RAM, reload chọn lại; localStorage/IDB có thể bị xóa.

## SHA-256 file trong scope

| File | SHA-256 |
|---|---|
| docs/software/community-online/001-community.sql | c18d1fd97841eda278afc502f7061be414963aedeb6570c03af9cd43da84d926 |
| docs/software/community-online/IMPLEMENTATION.md | 3578c21d43379a92ba78a8735373618c0db7286c985b5683603b994552f9e756 |
| docs/software/community-online/README.md | 8e0135053dccc0f361d61c5cdcf67b8e39235b28cb79e21eb887bea62c81d48c |
| docs/software/community-online/implementation-snapshot.json | e64c49a4a325447c88498f58a325fd48beb58fbbb80cce6815310a04f3f282dd |
| e2e/community-attachments.spec.mjs | b8fa5d6aa112258c6aec407a858918ae9fcffb36aef6b076481110187a0e56c9 |
| src/components/community/CommunityAttachments.tsx | cab7e4a51c4b560063613276265618d61187130d2061ab14a5293e591ae627fd |
| src/components/community/CommunityChrome.tsx | 6f58c7ba849fe7c5fb50b84bd32242d09c79551f14f030e709bc4b5304394b62 |
| src/components/community/ReportButton.tsx | b1a2a0aae9ead5480badccd02fd3e847b0a70f249dbfa2e7f45881292fcc56ad |
| src/lib/community.ts | 371cfaa85488c59c2928c274916c3599dd0dca779aa30ccb602115a1c6305e06 |
| src/lib/communityAttachmentStore.ts | 43809dd9e4fafe1b0a9e972a94194bbede4ab97377933d8659ccb49c48d83484 |
| src/lib/communityAttachments.ts | 7c56025ee3f18323527459d325082beac9ccae78fca1d17dc2f1eac60520317a |
| src/lib/communityDrafts.ts | 848973584121f809fb908838ac061adb0e4bd2f0d07fbda42d5a8072d0e4ac2e |
| src/lib/communityRemoteRepository.ts | 36282959704135f60d4b25c2ef1b06767f2826f20bb9025142601a72d70ca168 |
| src/lib/communityStore.ts | c42e02d18db277f3d68a2315882809df384cea2826aaae014e2abc809a17cab3 |
| src/pages/Community.css | 28efdca62d139bca02c49b4582217f475de2bc1352e26f80dd4eb31599b25172 |
| src/pages/CommunityNewPostPage.tsx | 4139a9424974b2dff6630155250c6fd5dcee4cc6400aa8a72d3135d11d8fc677 |
| src/pages/CommunityPage.tsx | 183362314c8afcf70de20cbff77df3fa86c1f13aac45afa4e9225c74b17f6774 |
| src/pages/CommunityPostPage.tsx | c215a637ba75f9e103a4a8bcb3822669d3e4697bc240bde75a9fa83991b6f293 |
| tests/community-attachments.test.mjs | 6a163f785cd078e93dc467e3ffe4c30354d01f571c1db32c15a7938233d782fd |
| tests/community-remote.test.mjs | 140d167a3f1065d0311e943bb3c2942ff50c350b907943e924ce75a91e906f30 |
| tests/community.test.mjs | c3d2a5a295d874087b36ccb30ccdd0d6268efb79394ea801bd498f182f46c558 |
