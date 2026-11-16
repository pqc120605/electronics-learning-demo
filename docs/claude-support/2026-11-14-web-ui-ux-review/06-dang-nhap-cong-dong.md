# 06 — Đăng nhập Google/GitHub và Cộng đồng (chỉ UI, chưa đổi DB)

Ngày: 2026-11-14 · Phạm vi founder duyệt: "Chỉ làm UI, chưa đổi DB". Không tạo/sửa gì trong `supabase/**`, không mở `.env` thật, không thêm dependency.

## 1. Kết quả

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Trang `/login`, `/app/login` với nút Google + GitHub gọi `supabase.auth.signInWithOAuth({ provider })` | Xong | `src/pages/LoginPage.tsx`, `src/lib/auth.ts` |
| Chưa cấu hình Supabase → hiện "Đăng nhập chưa được kết nối", nút bị vô hiệu, không tạo phiên giả | Xong, có e2e | `e2e/auth-community.spec.mjs` test 1 kiểm tra nút disabled và không có khoá `sb-*` trong localStorage |
| Trang callback `/auth/callback`: đọc lỗi OAuth, chờ phiên, hiện avatar/tên, quay về `next` an toàn | Xong (nhánh "đã cấu hình" chưa chạy thật — cần Supabase) | `src/pages/AuthCallbackPage.tsx`, `safeNextPath` có unit test chống open redirect |
| Nút Đăng nhập/Đăng xuất ở header công khai + topbar workspace; giữ nhãn "Khách · lưu trên thiết bị" | Xong | `src/components/AuthMenu.tsx`; màn ≤760px nút nằm trong panel Menu để header vẫn một hàng |
| Cộng đồng `/community` + `/app/community`: 5 nhóm, tìm kiếm (bỏ dấu tiếng Việt), lọc thẻ, quy tắc | Xong | `src/pages/CommunityPage.tsx` |
| Chi tiết `/community/:postId`: nội dung markdown, khối code, bình luận, báo cáo vi phạm | Xong | `src/pages/CommunityPostPage.tsx`, `src/components/community/ReportButton.tsx` |
| Viết bài `/community/new`: tiêu đề, nhóm, thẻ, markdown đơn giản, nút "Chèn khối code", xem trước | Xong | `src/pages/CommunityNewPostPage.tsx`, `src/components/community/MarkdownEditor.tsx` |
| Tầng dữ liệu tách riêng (interface `CommunityRepository`) + bản xem trước dữ liệu mẫu + localStorage | Xong | `src/lib/community.ts`, `src/lib/communityStore.ts`, `src/data/communitySeed.ts` |
| Nhãn "Bản xem trước · bài viết chưa đồng bộ" ở mọi trang cộng đồng | Xong | `PreviewBanner` trong `src/components/community/CommunityChrome.tsx` |
| Có Supabase mà chưa đăng nhập → không cho viết bài/bình luận, hiện link đăng nhập | Xong (logic), chưa e2e vì bản build test không có Supabase | `useWriteAccess()` |
| Chống XSS: không render HTML thô | Xong, có unit + e2e | Markdown → AST → phần tử React; link chỉ http/https; unit test grep cấm `dangerouslySetInnerHTML`/`innerHTML`; e2e đăng bài có `<img onerror>` và `<script>` → hiện dạng chữ, không có `<img>`, `window.__xss` undefined |
| Route + nav: `App.tsx`, `productRoutes.ts`, `productFeatureRegistry.ts` (nhóm "CỘNG ĐỒNG"), link "Cộng đồng" ở header, rail và thanh mobile (7 mục) | Xong, không đổi route cũ | unit test "routes are registered…" + `/admin/login` vẫn còn |

### Quy tắc viết khi chưa có Supabase

Bản build hiện tại không có biến Supabase. Vì vậy cộng đồng cho **khách viết nháp cục bộ** dưới tên "Khách (thiết bị này)". Trang ghi rõ điều này. Khi có Supabase, người chưa đăng nhập bị chặn viết. Người đã đăng nhập vẫn chỉ lưu cục bộ, vì chưa có bảng. Nếu founder muốn chặn viết hẳn khi chưa có Supabase, chỉ cần đổi một nhánh trong `useWriteAccess()`.

## 2. File thay đổi

Mới:
- `src/lib/authUser.ts` — hàm thuần: `toAuthUser`, `safeAvatarUrl` (chỉ https), `safeNextPath` (chống open redirect), `readOAuthError`, `initialsOf`.
- `src/lib/auth.ts` — `signInWithProvider`, `signOutUser`, `readCurrentUser`, hook `useAuth`.
- `src/lib/community.ts` — kiểu dữ liệu, `CommunityRepository`, `createPreviewRepository`, validate, lọc, chuẩn hoá thẻ.
- `src/lib/communityStore.ts` — singleton repository + helper đường dẫn.
- `src/lib/simpleMarkdown.ts` — parser markdown → AST, `markdownExcerpt`.
- `src/data/communitySeed.ts` — 8 bài + 7 bình luận mẫu, tác giả gắn "(mẫu)".
- `src/components/AuthMenu.tsx/.css`, `src/components/UserAvatar.tsx`.
- `src/components/community/{CommunityChrome,MarkdownView,MarkdownEditor,ReportButton}.tsx`.
- `src/pages/{LoginPage,AuthCallbackPage,CommunityPage,CommunityPostPage,CommunityNewPostPage}.tsx`, `src/pages/Community.css` (chỉ dùng token `--mm-*`).
- `tests/community.test.mjs`, `e2e/auth-community.spec.mjs`.

Sửa:
- `src/App.tsx` — thêm 10 route, lazy import.
- `src/data/productRoutes.ts` — thêm `appCommunity`, `publicCommunity`, `appLogin`, `publicLogin`, `authCallback`, tiêu đề tab.
- `src/data/productFeatureRegistry.ts` — feature `community`, nhóm nav `CỘNG ĐỒNG`, thêm vào `publicFeatureOrder`.
- `src/components/SiteShell.tsx`, `SiteNavigation.tsx`, `AppWorkspaceNavigation.tsx/.css` — nút đăng nhập, link Cộng đồng, lưới mobile 6→7 cột.

Không đụng: `src/components/builder/**`, `CircuitBuilderPage.tsx`, `src/data/*lesson*`, `public/models/**`, `supabase/**`, firmware, cấu hình build/CI.

## 3. Hướng dẫn founder bật đăng nhập Google/GitHub

Founder tự làm các bước dưới đây. Claude không tạo app OAuth, không đọc hay ghi secret. Client secret chỉ nhập vào Supabase dashboard, **không bao giờ** đưa vào `.env` của frontend hay vào repo.

### 3.1 Lấy thông tin Supabase

1. Mở Supabase dashboard → project của Mạch Mở.
2. Ghi lại **Project URL** dạng `https://<project-ref>.supabase.co`.
3. URL callback cho Google/GitHub là `https://<project-ref>.supabase.co/auth/v1/callback`. Trang Auth → Providers của Supabase cũng hiện sẵn URL này.

### 3.2 Google (đăng nhập bằng Gmail)

1. Vào Google Cloud Console → chọn hoặc tạo project.
2. **APIs & Services → OAuth consent screen**: chọn External, điền tên app "Mạch Mở", email hỗ trợ, domain. Scopes chỉ cần `openid`, `email`, `profile`.
3. **Credentials → Create credentials → OAuth client ID** → loại *Web application*.
4. *Authorized JavaScript origins*: domain web thật (vd `https://machmo.vn`) và `http://localhost:5173` khi dev.
5. *Authorized redirect URIs*: `https://<project-ref>.supabase.co/auth/v1/callback`.
6. Lưu Client ID và Client secret.
7. Supabase → **Authentication → Providers → Google**: bật, dán Client ID + Client secret, Save.
8. Trước khi mở công khai, chuyển consent screen sang *In production*. Nếu không, chỉ test user đăng nhập được.

### 3.3 GitHub

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
2. *Homepage URL*: domain web thật.
3. *Authorization callback URL*: `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Tạo app, rồi bấm **Generate a new client secret**.
5. Supabase → **Authentication → Providers → GitHub**: bật, dán Client ID + secret, Save.

### 3.4 Redirect URL của web

Supabase → **Authentication → URL Configuration**:
- *Site URL*: domain web thật.
- *Redirect URLs*: thêm `https://<domain>/auth/callback` và `http://localhost:5173/auth/callback` khi dev.
  Có thể dùng wildcard `https://<domain>/auth/callback**`, vì web gắn `?next=` vào callback.

### 3.5 Biến môi trường frontend

Dùng lại đúng hai biến khu quản trị đang dùng, xem `.env.example`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (anon/publishable key, không phải service role)

Build lại web. Trang `/login` sẽ tự bật hai nút. Hãy thử: bấm Google → về `/auth/callback` → thấy avatar + tên → tự chuyển về trang trước.

### 3.6 Lưu ý

- Khu quản trị vẫn đăng nhập email/mật khẩu như cũ. User OAuth **không** tự thành admin, vì quyền admin vẫn nằm ở bảng `site_admins`.
- Nếu bật "Allow new users to sign up", ai có Google/GitHub cũng tạo được tài khoản. Đây là điều cộng đồng cần, nhưng nên bật CAPTCHA/rate limit của Supabase Auth.
- Cần cập nhật trang `/privacy`: thêm việc lưu tên, avatar và email do Google/GitHub cung cấp. Trang này **chưa sửa** trong đợt này.

## 4. Đề xuất schema + RLS cho cộng đồng (chỉ tài liệu, chưa tạo migration)

Mục tiêu: thay `createPreviewRepository` bằng một `createSupabaseRepository` theo cùng interface `CommunityRepository`. UI không phải đổi.

```sql
-- Hồ sơ công khai tối thiểu (không lưu email ở bảng public)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text check (avatar_url is null or avatar_url like 'https://%'),
  created_at timestamptz not null default now()
);

create type public.community_category as enum ('co-ban','nhung','iot','du-an','hoi-dap-loi');
create type public.content_status as enum ('published','hidden','removed');

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category public.community_category not null,
  title text not null check (char_length(title) between 8 and 120),
  body text not null check (char_length(body) between 20 and 10000),
  tags text[] not null default '{}' check (cardinality(tags) <= 5),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.community_posts (category, created_at desc) where status = 'published';
create index on public.community_posts using gin (tags);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 4000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now()
);
create index on public.community_comments (post_id, created_at);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','offensive','unsafe','off-topic','other')),
  note text check (note is null or char_length(note) <= 500),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

alter table public.profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

-- Hàm kiểm tra admin dùng bảng site_admins đã có
create function public.is_site_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from public.site_admins where user_id = auth.uid()) $$;

-- profiles: ai cũng đọc; chỉ chủ sở hữu sửa
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- posts: đọc bài published (admin đọc hết); viết khi đăng nhập và author = mình
create policy "posts read" on public.community_posts for select using (status = 'published' or author_id = auth.uid() or public.is_site_admin());
create policy "posts insert own" on public.community_posts for insert to authenticated with check (author_id = auth.uid() and status = 'published');
create policy "posts update own" on public.community_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid() and status <> 'removed');
create policy "posts moderate" on public.community_posts for update to authenticated using (public.is_site_admin());

-- comments: tương tự, chỉ bình luận vào bài published
create policy "comments read" on public.community_comments for select using (status = 'published' or author_id = auth.uid() or public.is_site_admin());
create policy "comments insert own" on public.community_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "comments moderate" on public.community_comments for update to authenticated using (public.is_site_admin());

-- reports: người dùng chỉ tạo; chỉ admin đọc/xử lý
create policy "reports insert own" on public.community_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports admin read" on public.community_reports for select to authenticated using (public.is_site_admin());
create policy "reports admin update" on public.community_reports for update to authenticated using (public.is_site_admin());

-- Tạo profile khi user OAuth đăng ký (lấy tên/avatar từ metadata)
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1), 'Thành viên'), 60),
    case when new.raw_user_meta_data->>'avatar_url' like 'https://%' then new.raw_user_meta_data->>'avatar_url' end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
```

Lưu ý về policy `posts update own`: tác giả **không được** tự đặt `status = 'removed'`. Nhưng tác giả vẫn đổi được `hidden` thành `published`, kể cả bài admin đã ẩn. Khi viết migration nên thêm trigger chặn trường hợp này. Cách khác: tách cột `moderation_status` mà chỉ admin được ghi.

Cần founder quyết trước khi viết migration:
1. Người dùng có được **sửa/xoá** bài của mình không, và trong bao lâu? Policy trên cho sửa không giới hạn và không cho xoá cứng.
2. **Rate limit** đăng bài: dùng trigger đếm bài/giờ, hoặc Edge Function. RLS không chặn spam theo tần suất.
3. Tìm kiếm: `ilike` đủ cho vài nghìn bài. Lớn hơn nên dùng `tsvector` với `unaccent` để tìm không dấu như bản xem trước.
4. Đếm bình luận: view `community_posts_with_counts` hay cột đếm cập nhật bằng trigger.
5. Có chuyển bài nháp localStorage của khách lên tài khoản sau khi đăng nhập không? Hiện chưa làm. Khoá lưu là `mach-mo-community-preview-v1`.

## 5. Kiểm tra đã chạy

| Lệnh | Kết quả |
|---|---|
| `npm.cmd run typecheck` | Sạch |
| `npm.cmd test` | 588/588 pass (gồm 11 test mới trong `tests/community.test.mjs`) |
| `npm.cmd run build:local` | Build OK. Cảnh báo `eval` có sẵn từ engine SPICE, không liên quan |
| Playwright toàn bộ (config tạm, port 5231, vì 5196 bị chiếm) | 92 pass / 4 fail. 3 fail baseline đã biết: `journeys.spec.mjs:35` ×2 và `:812`. Fail thứ 4: `offline.spec.mjs:8` (xem dưới) |
| Playwright sau khi sửa test offline: `offline.spec.mjs` + `auth-community.spec.mjs` | 19/19 pass |
| Playwright `accessibility.spec.mjs` + `one-screen-layout.spec.mjs` (sau thay đổi header/nav) | Pass |
| `auth-community.spec.mjs` | Đăng nhập chưa cấu hình; header/topbar; lọc cộng đồng; tạo bài + XSS + bình luận + báo cáo; axe serious/critical = 0 ở 6 route × 375/1440px; không cuộn trang ở 1280×720 và 1440×900; không cuộn ngang ở 375px |

**Vì sao `offline.spec.mjs` fail và cách sửa.** Service worker precache 3 URL shell, cộng với mọi `/assets/*.js|css` mà `index.html` tham chiếu. Sau thay đổi, bundler tách entry thành thêm 2 chunk preload là `jsx-runtime` và `supabase`. Số asset precache vì thế tăng từ 5 lên 7. Supabase vốn đã nằm trong entry, vì `AdminGate` import tĩnh. Do đó lượng byte tải ban đầu thực tế không tăng; chỉ là bị tách file. Hành vi SW vẫn đúng. Test cũ khoá cứng số `5`. Test đã được nới thành `3 + số asset JS/CSS trong index.html`, giữ nguyên ý định "precache shell + asset ban đầu, xoá cache cũ khi deploy".

Kiểm tra trực quan bằng ảnh Playwright: header 1280/375, cộng đồng 1440/1280/375, chi tiết bài, viết bài, đăng nhập. Hai lỗi phát hiện qua ảnh đã sửa: đoạn trích làm mất dấu `-` (`ESP32-C3`), và avatar dự phòng ra "C(". Header mobile vẫn một hàng như cũ; nút đăng nhập nằm trong panel Menu.

Chưa chạy: luồng OAuth thật, vì không có Supabase/OAuth app. Chưa kiểm tra trình đọc màn hình thật; chỉ dùng axe.

## 6. Giới hạn, việc chưa làm

- Nhánh OAuth "đã cấu hình" (redirect thật, callback có phiên) **chưa chạy được**, vì không có Supabase project trong phiên này. Nhánh này chỉ được kiểm bằng typecheck và đọc code.
- Báo cáo vi phạm chỉ lưu trên thiết bị. Chưa có người kiểm duyệt, và UI ghi rõ điều này.
- Bài nháp của khách không đồng bộ giữa thiết bị. Xoá dữ liệu trình duyệt sẽ mất bài nháp.
- Chưa có phân trang, sửa/xoá bài, upvote hay thông báo. Các tính năng này để sau khi có DB.
- Trang `/privacy` chưa nhắc tới dữ liệu tài khoản OAuth (xem 3.6).
- Bố cục dùng token sẵn có. Phiên thiết kế lại toàn web có thể thay `Community.css` mà không phải đổi logic.
