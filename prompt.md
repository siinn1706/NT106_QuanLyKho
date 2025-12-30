
---

Bạn là Claude Opus 4.5 ở chế độ **Agent**. Nhiệm vụ: thiết kế + implement UI cho app desktop Quản Lý Kho (Tauri + React + TS + Tailwind). UI phải “trông người làm”, đồng bộ, tối giản, có cá tính riêng và **không bị vibe “AI UI”**.

# 0) Ưu tiên thiết kế (thứ tự bắt buộc)

1. **Apple Liquid-Glass design references trước**: lấy tinh thần “clarity, deference, consistency”, hierarchy rõ, spacing nhịp nhàng, typography clean, states tinh tế, motion mượt.
2. **Resources của dự án là SOURCE OF TRUTH để implement**: mọi token, icon, font, spacing, radius… phải được **map từ Apple-style về đúng resources** và áp vào code.
3. Nếu resources thiếu: mới được dùng thư viện ngoài và phải ghi rõ “external fallback” + lý do.

# 1) Context dự án (bắt buộc tuân thủ)

Repo (tóm tắt theo tree):

* NT106_QUANLYKHO_NHOM12/

  * KhoHang_API/ (không động vào trừ khi UI cần mock data)
  * UI_Desktop/

    * resources/

      * Colors.pdf
      * Typography.pdf
      * Dimentions.pdf
      * Effects.pdf
      * Layers.pdf
      * Componenst.pdf
      * Icon/ (rất nhiều svg icon)
      * San Francisco Pro/ (font)
    * src/

      * app/
      * assets/
      * components/
      * features/

        * auth/
        * dashboard/ (Dashboard_Page.tsx)
        * items/ (Items_Alerts_Page.tsx)
        * reports/
        * stock/
        * suppliers/
      * resources/
      * state/
      * styles/
      * App.tsx, main.tsx, App.css
    * tailwind.config.js, postcss.config.cjs, vite.config.ts, package.json, src-tauri/

# 2) Rule “Apple-first → Resources-locked” (CẤM VI PHẠM)

1. Mọi đề xuất UI phải theo tinh thần Apple (clean, hierarchy rõ, spacing chuẩn, states tinh tế).
2. Khi implement, **bắt buộc** dùng `UI_Desktop/resources/*` để:

   * màu, spacing, radius, effect, typography, icon.
3. Nếu một thứ *không tồn tại* trong resources:

   * mới được dùng thư viện ngoài (FontAwesome/Lucide/…)
   * nhưng phải ghi rõ trong commit/notes: “external fallback: … vì resources không có …”
4. **CẤM dùng emoji icon**. Icon phải ưu tiên SVG từ `resources/Icon/`.

# 3) Chống “AI-looking UI” (bắt buộc áp dụng)

UI phải tránh các dấu hiệu “AI UI”:

* ❌ Tránh box-shadow (gần như cấm). ✅ Thay bằng border nhẹ + nền phân lớp (surface).
* ❌ Gradient giảm tối đa. ✅ Chỉ dùng gradient rất nhẹ cho hover/active nếu thật cần.
* ❌ Rounded quá đà. ✅ Theo quy tắc: **rounded của cha > con**; giữ mức vừa phải.
* ❌ Glassmorphism/blur background lạm dụng.
* ❌ Lạm dụng tông xanh-tím “AI hay gen” nếu Colors.pdf không chọn như vậy.
* ❌ Animation lố. ✅ Motion tinh tế, đồng bộ, mượt (150–220ms), ưu tiên transition hơn là motion phức tạp.

# 4) Bước làm việc bắt buộc (Agent phải làm đúng thứ tự)

## Step A — Apple reference → chốt style direction

1. Đề xuất style direction theo Apple: layout, typography hierarchy, density, button/input feel, states, motion.
2. Sau đó **map** toàn bộ style direction sang tokens thực tế từ resources.

## Step B — Đọc resources và đóng gói rules

1. Mở và đọc các file:

   * `resources/Colors.pdf` → palette + semantic tokens (light/dark nếu có)
   * `resources/Typography.pdf` → font family, size scale, weight, line-height
   * `resources/Dimentions.pdf` → spacing scale, radius scale, layout grid
   * `resources/Effects.pdf` → border, opacity, states (hover/pressed/focus)
   * `resources/Layers.pdf` → layering bằng màu/border (KHÔNG shadow)
   * `resources/Componenst.pdf` → component anatomy (button/input/card/table/…)
   * `resources/Icon/` → icon set (outline/filled nếu có)
2. Tạo file `UI_Desktop/UI_RULES.md` (hoặc `UI_Desktop/src/styles/UI_RULES.md`) gồm:

   * Apple-style principles áp dụng trong dự án (ngắn gọn)
   * Tokens màu (light/dark) + mapping semantic (bg/surface/text/border/accent/status)
   * Typography scale
   * Spacing scale
   * Radius scale (cha > con)
   * Component rules (Button/Input/Card/Modal/Table/Badge/Sidebar/Topbar)
   * Motion rules (timing/easing)
   * “CẤM” list: shadow, emoji, blur lạm dụng, gradient lạm dụng

## Step C — Setup Light/Dark Mode chuẩn hoá theo tokens

Mục tiêu: 1 hệ theme dùng CSS variables + Tailwind.

1. Cấu hình Tailwind theo hướng dùng CSS variables:

   * `:root` = light, `.dark` = dark
   * Không hardcode màu rải rác trong component (trừ trường hợp đặc biệt)
2. Tạo file `src/styles/tokens.css` (hoặc `src/styles/theme.css`) chứa variables:

   * `--bg`, `--surface-1`, `--surface-2`, `--text-1`, `--text-2`, `--border`, `--accent`, `--danger`, `--warning`, `--success`, ...
   * Các biến phải suy ra từ Colors.pdf (semantic > primitive)
3. Tạo `ThemeProvider` + `useTheme()`:

   * lưu theme vào `localStorage`
   * áp `.dark` lên `document.documentElement`
   * đảm bảo Tauri reload vẫn giữ theme

## Step D — Build “UI kit” tối thiểu (resources-locked)

Tạo/chuẩn hoá các component trong `src/components/`:

* Button (variants: primary/secondary/ghost/destructive)
* Input + Select + Textarea
* Card / Panel
* Badge / StatusPill
* Table (header, row hover, empty state)
* Modal / Dialog
* Tabs (nếu có)
* Sidebar navigation item

Yêu cầu:

* Border-based depth (không shadow)
* Radius theo scale và “cha > con”
* Icon dùng từ `resources/Icon/` qua component `<AppIcon name="..." variant="outline|filled" />`

## Step E — Áp dụng vào screens theo flow features hiện có

Áp dụng UI rules vào các trang chính (ưu tiên những cái đã có trong tree):

* `src/features/dashboard/Dashboard_Page.tsx`
* `src/features/items/Items_Alerts_Page.tsx`
* (tiếp theo) stock, suppliers, reports, auth (nếu đang có)

Mỗi page cần:

* Layout thống nhất: Sidebar + Topbar + Content
* Header section rõ hierarchy (title + subtitle + actions)
* States: loading / empty / error
* Không dùng emoji, không shadow, không “card gradient loạn”

# 5) Icon usage bắt buộc (resources/Icon)

* Không import icon lib ngoài nếu resources có.
* Tạo `src/components/AppIcon.tsx`:

  * map name → import svg
  * hỗ trợ size (16/20/24), className
  * cho phép filled/outline nếu trong resources có file *_filled.svg

# 6) Font usage (npm sf-pro ONLY)

**Primary**: SF Pro (npm: `sf-pro`)
**Không dùng font ngoài** trừ khi Typography.pdf bắt buộc.

```bash
npm i sf-pro

mkdir -p public/fonts
cp node_modules/sf-pro/font/woff2/* public/fonts/
```

Import trong `src/styles/index.css` (hoặc global css đang dùng):

```css
@import './tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* SF Pro Display */
@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display_regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display_medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display_semibold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
```

CSS Variable:

```css
:root {
  --font-sans: "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
```

Tailwind mapping (nếu cần):

```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-sans)'],
    },
  },
}
```

Typography phải khớp Typography.pdf: size/weight/line-height.

# 7) Acceptance criteria (xong mới dừng)

* Có `UI_RULES.md` đầy đủ, dễ áp dụng về sau.
* Light/dark mode chạy thật, contrast ổn.
* UI clean, tối giản, không shadow, không emoji, gradient tối thiểu.
* Dashboard + Items Alerts nhìn cùng hệ (spacing/radius/type/icon).
* Không phá structure hiện có; code rõ ràng, component tái sử dụng.
* Sau mỗi Step: liệt kê file nào tạo/sửa và lý do ngắn gọn.

# 8) Working style

* Trước khi sửa: đọc code hiện tại (App.tsx, routes, layout).
* Thiết kế theo Apple reference trước, nhưng khi code phải “resources-locked”.
* Khi thiếu token/icon/font: ghi rõ “fallback external” và lý do.
* Mỗi Step xong phải liệt kê: file nào tạo/sửa + tóm tắt lý do.

# 9) API Contract Comment (BẮT BUỘC – hỗ trợ BE)

Mọi chỗ FE gọi API (get/post/put/delete) đều phải có comment mô tả **JSON contract** ngay phía trên call.

Format chuẩn:

```ts
/**
 * API: <METHOD> <ENDPOINT>
 * Purpose: <mục đích ngắn>
 * Request (JSON): <object | null>
 * Response (JSON) [200]: <object>
 * Response Errors:
 * - 400: { "detail": "..." }
 * - 401: { "detail": "Unauthorized" }
 * - 500: { "detail": "Internal Server Error" }
 * Notes: <date ISO, enum values, pagination...>
 */
```

Chuẩn hoá:

* snake_case nếu BE theo FastAPI/Pydantic
* Date/time ISO-8601
* Enum ghi rõ tập giá trị
* Pagination phải có page/limit/total/items

# 10) Comment code rõ ràng

Mọi chỗ code phức tạp, logic không rõ ràng, hoặc có workaround → comment giải thích.
Không comment các đoạn hiển nhiên/đúng chuẩn.
Không comment chỉ vì “prompt AI”.

Bắt đầu ngay: thực hiện Step A → Step B → Step C → Step D → Step E. Sau mỗi step tóm tắt file nào đã tạo/sửa và vì sao.

---