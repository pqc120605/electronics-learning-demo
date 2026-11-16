# Cộng đồng online — gói thiết lập cho founder

Revision 1 · 16/11/2026 · MM-SW-COMMUNITY-ATTACH-001 · EXP-01/EXP-05.

**Hiện trạng:** chưa có Supabase project của founder. Chưa áp dụng SQL, chưa thử OAuth, upload thật, RLS hay hai người dùng trên máy chủ (**NOT_RUN**). Source adapter và SQL là gói chuẩn bị; không phải xác nhận online đang hoạt động. Cần QA độc lập và checklist bên dưới trước dùng chung công khai.

## 1. Tạo project và đăng nhập

1. Founder tạo project tại Supabase, chọn region và lưu mật khẩu DB trong kho riêng. Không gửi mật khẩu, OAuth secret, service-role hoặc secret key vào chat/repo/frontend.
2. Trong SQL Editor của **đúng project**, đọc rồi chạy nguyên file [001-community.sql](001-community.sql) một lần. Script có transaction, không tự ghi đè community schema cũ; nếu tên bảng/bucket/policy đã tồn tại, dừng và kiểm tra trước khi chạy migration riêng. Nó độc lập với analytics/admin migrations 0001/0002, không cần cấp quyền admin cho thành viên cộng đồng.
3. Kiểm tra bucket `community-attachments`: **private**, file size limit **10485760 bytes**, allowed MIME **application/octet-stream**. Không chuyển public. Không thêm policy rộng cho bucket này. Restrictive guard bảo vệ cả khi project đã có policy Storage rộng từ ứng dụng khác.
4. Auth → Providers: bật Google và/hoặc GitHub, tạo OAuth app tương ứng theo hướng dẫn provider của Supabase; callback của provider là URL `https://<PROJECT_REF>.supabase.co/auth/v1/callback` do Dashboard hiển thị. Provider client secret chỉ nhập ở Dashboard.
5. Auth → URL Configuration: Site URL cho thử cục bộ `http://127.0.0.1:5320`; Redirect URLs cho `http://127.0.0.1:5320/auth/callback` và `http://127.0.0.1:5320/auth/callback?next=**` để callback có tham số `next`. Nếu dùng hostname localhost/port khác thì thêm **đúng** origin đó; không dùng wildcard host ở production. Khi có production, thêm `https://<ten-mien>/auth/callback` và `https://<ten-mien>/auth/callback?next=**`, đổi Site URL, kiểm tra lại OAuth. Đừng xoá localhost trước khi thử xong.
6. Founder tự tạo/cập nhật `.env.local` trên máy chạy app, ngoài Git, dùng URL project và **anon key hoặc publishable key** từ Dashboard (giữ tên biến đang có để tương thích):

```dotenv
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_OR_PUBLISHABLE_KEY>
```

Đây là khoá công khai dành cho trình duyệt; quyền thật do Auth/RLS. **Không bao giờ dùng service-role/secret key trong VITE_**. Không cần gửi giá trị cho agent. Restart dev server/rebuild riêng sau khi thay biến; Vite đọc lúc khởi động/build. Không có key giả hoặc giá trị hardcode trong source.

## 2. Nguồn dữ liệu và chuyển đổi

- Chưa cấu hình URL/key: nhãn **Bản xem trước**, giữ seed và bài/bình luận/báo cáo localStorage cũ (`mach-mo-community-preview-v1`). Không có online giả.
- Có URL/key: mặc định **Cộng đồng online**, đọc bài đã công bố từ Supabase. Thiếu schema/bucket/phiên/kết nối phải hiện lỗi; không đổi nguồn âm thầm thành local success.
- Nút **Xem bài trên thiết bị** / **Mở cộng đồng online** là lựa chọn tường minh, lưu ở `mach-mo-community-source` rồi tải lại trang. Bài cũ không mất và không tự upload. Các đường dẫn `/community` và `/app/community` giữ nguyên.
- Nháp chữ compose dùng `mach-mo-community-compose-v1`. Tệp đang chọn chỉ trong bộ nhớ cho tới khi đăng thành công; reload phải chọn lại. Input được giữ khi upload/storage/publication thất bại. Sửa nội dung sau lỗi tạo request ID mới; draft cũ vẫn riêng tư để founder kiểm tra/dọn.
- Local post metadata vẫn ở localStorage v1, thêm `attachments?` tùy chọn; blobs ở IndexedDB `mach-mo-community-attachments-v1/blobs`. Chỉ báo lưu thành công sau transaction commit. Nếu IndexedDB/quota/transaction thất bại không ghi post một phần; nếu ghi metadata thất bại sẽ cố rollback blobs. Dọn rollback thất bại có thể để blob mồ côi riêng trên máy, không công bố. Trình duyệt/private mode/xóa site data có thể xoá kho; đây không phải backup/sync bảo đảm. Hãy tải tệp cần giữ. Mất blob hiển thị “Thiếu tệp”, không hiển thị link tải thành công giả.

## 3. Hợp đồng online và giới hạn bảo vệ

- Authenticated writes qua RPC; tác giả lấy từ `auth.uid()` + profile Auth ở máy chủ. Caller không truyền được author_id. Anonymous chỉ đọc published posts/comments/attachments; reports chỉ project owner đọc trong Dashboard, chưa có moderation UI/SLA.
- `community_begin_post` giữ draft riêng tư với ID yêu cầu; retry cùng nội dung/files dùng lại ID. File fingerprints SHA-256 chỉ dùng nhận diện nội dung retry **do client khai báo**, không phải server integrity/malware verification.
- Upload path chính xác `<auth.uid>/<post UUID>/<index 0..4>`, `upsert:false`, content type octet-stream; không update/move/delete qua client. Guard khoá hàng draft để serialize upload/publication; tối đa 5 objects, mỗi object 10 MiB, tổng 25 MiB. Bucket byte limit + metadata size **do Storage service sinh** là nguồn kiểm byte count; manifest/MIME do client báo không phải bằng chứng. Upload không có size metadata hợp lệ bị từ chối. Cần live-test Storage version của project vì đây là boundary phụ thuộc dịch vụ.
- `community_publish_post` khoá draft, xác minh đủ objects/size/count từ Storage records và commit attachments + published status trong cùng transaction. Không render HTML/SVG/JS; các loại file khác chỉ tải octet-stream, code không chạy, PDF/JSON/text không embed. Chỉ raster có signature và browser decode hợp lệ mới có ảnh preview; giới hạn 40 megapixel sau decode. Không có server-side transcoding/content verification/malware scan; không cam kết phát hiện polyglot, file độc hoặc chống image decoder resource exhaustion. Đừng chạy file tải từ người lạ.
- Bucket private; RLS chỉ cấp đọc object thuộc post published, kể cả chủ draft không tự tạo signed URL cho draft. UI xin signed URL 60 giây rồi fetch blob; không dùng public URL. Signed URL là bearer token trong thời gian hiệu lực, không chia sẻ log URL. Blob preview URLs thu hồi khi remove/unmount; link download tạo blob octet và được thu hồi sau thao tác.
- Thất bại trước publish giữ draft/blobs riêng tư để retry. Nếu publish đã commit nhưng response mất, retry cùng ID trả lại bài đã công bố. Chưa có background sync/draft recovery UI hay tự dọn server. Trước khi đổi nguồn/rời trang, sao chép input nếu cần.
- Rate limits server theo tài khoản: 10 draft mới/giờ (gồm draft chưa xong), 60 comments/giờ, 20 reports/ngày; serialized per-user lock. Không có CAPTCHA, quota tổng mỗi tài khoản, IP throttling, realtime, pagination UI hoặc automatic moderation. Với nhiều tài khoản/traffic lớn cần policy vận hành/budget/abuse control bổ sung trước mở rộng công khai. API list chịu server row cap; chưa cam kết tìm kiếm toàn bộ kho lớn.

## 4. Checklist chạy thật — hiện tất cả NOT_RUN

Dùng hai browser profiles **A**, **B** (hai tài khoản khác nhau), một cửa sổ ẩn danh không đăng nhập **G**. Dùng public/anon key + user sessions đúng vai trò khi thử API; SQL Editor/service-role bypass RLS nên không dùng để kết luận client ownership PASS. Ghi project ref không bí mật, schema hash, browser/date, expected/actual, mã lỗi đã bỏ token, và ID bài thử.

| Case | Expected |
|---|---|
| Không config | Preview guest đọc/viết local, không session giả; bài local cũ còn |
| Config đúng + schema | Nhãn online, danh sách public; OAuth callback về đúng `next` |
| Có URL/key, thiếu schema hoặc sai bucket | Hiện lỗi; không báo đăng thành công hoặc tự trộn local |
| G đọc post published/comment/download | Đọc được; signed URL hết hạn sau 60s |
| G gọi 4 write RPC / direct table inserts / upload | Bị từ chối; không có row/object mới |
| A tạo draft + upload chưa publish | G/B không đọc row/blobs; G/B/**A** không ký được URL draft |
| B dùng ID/path draft của A để begin/publish/upload/update/delete | Bị từ chối; dữ liệu A giữ nguyên |
| A giả author trong direct insert, gọi RPC giả p_author_id | Không insert được; RPC không có tham số tác giả; bài thật là A |
| A publish 0,1,5 attachments | B đọc đúng nội dung + tải bytes đúng; G đọc được sau publish |
| Upload 10MiB chính xác; 10MiB+1; 6 files; total25MiB; total25MiB+1 | Chính xác biên hợp lệ được; vượt biên bị từ chối cả khi bỏ qua UI; thử upload đồng thời |
| Fake manifest size=1 với blob lớn; MIME ảnh giả; HTML/SVG/JS tên giả | Size thực vẫn chặn tại Storage/publish; UI không render active content, fake raster không preview; chỉ download octet |
| Publish trước đủ uploads; upload/update sau publish | Bị từ chối; chưa đủ thì draft vẫn private |
| Mất mạng/response upload hoặc publish, retry cùng ID | Biểu mẫu/files giữ; retry không tạo public duplicate; draft chưa đủ không public |
| A report, B đọc reports/direct writes; G report | A có receipt; B/G không đọc báo cáo; anonymous write từ chối |
| Đủ rate limit theo account | Request vượt hạn bị từ chối; B có quota riêng |
| Explicit local source và back online | Bài local cũ và nháp còn, không auto-upload; online không lẫn sample |
| Local IndexedDB blocked/disabled/quota/abort, mất blob | Không post partial; giữ input; missing attachment nói thật |

Nếu tests fail, chưa mở rộng community cho người dùng; gửi lỗi đã bỏ token để sửa. Chưa có project nên không thể tự đánh dấu bảng này đạt.

## 5. Dọn draft / rollback

Founder kiểm tra draft cụ thể trong `community_posts` bằng SQL Editor; không xoá draft đang được retry. Với draft bỏ dở đã xác nhận: dùng Dashboard **Storage API/UI** để xoá objects theo đúng prefix, sau đó xoá row draft cụ thể (`status='draft'`) qua SQL Editor. Không xoá trực tiếp rows trong `storage.objects`: metadata deletion không đồng nghĩa xoá bytes trong object store. Không cấp service role cho client để dọn.

Rollback UI bằng chọn preview (hoặc bỏ biến Supabase và rebuild); local data không đổi, dữ liệu server vẫn giữ. Trước rollback schema cần backup DB và tải attachments cần giữ qua Storage; đừng drop bucket/schema trong khi còn bài cần khôi phục. Package không có destructive automatic rollback và không tự áp dụng migration.

Nguồn API/security tham khảo chính thức: [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [access control](https://supabase.com/docs/guides/storage/security/access-control), [signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). API đã đối chiếu qua tài liệu Supabase; đây không thay live verification ở project của founder.
