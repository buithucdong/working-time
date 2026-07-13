# Changelog - Working Time Extension

Tất cả các thay đổi quan trọng của dự án sẽ được ghi lại trong file này.

## [1.3.0] - 2026-07-13

### ⚙️ Engine chặn mới (declarativeNetRequest + Service Worker)

#### Added
- **Trang chặn nội bộ `blocked.html`**: trang gốc không bao giờ kịp hiển thị (hết flash nội dung), không tải bất kỳ tài nguyên ngoài nào
- **Background service worker**: tự động tính toán và áp dụng luật chặn mỗi phút — hoạt động kể cả khi popup đóng
- **Chặn tab đang mở sẵn**: tab mở trước giờ chặn sẽ bị chuyển hướng trong vòng ≤1 phút khi khung giờ bắt đầu, không cần reload
- **Link "Quay lại trang này khi hết giờ chặn"** trên trang chặn — giữ lại URL gốc
- **Nút ủng hộ (Buy me a coffee)** ở cuối popup
- **Fonts đóng gói cục bộ** (Poppins + Open Sans woff2): không còn tải từ Google Fonts CDN

#### Fixed
- **Lỗi hẹn giờ tạm dừng chết khi đóng popup**: tạm dừng giờ do background quản lý qua `pauseEndTime` — đóng popup, tắt trình duyệt vẫn tự khôi phục chặn đúng giờ
- **Tạm dừng không còn ghi đè cờ bật/tắt từng domain**: hết giờ tạm dừng, trạng thái bật/tắt của từng trang giữ nguyên như người dùng đã đặt
- **Lỗi gắn trùng event handler** cho nút xóa/toggle trong danh sách domain (trước đây mỗi click chạy 2 lần)

#### Changed
- **UI popup thiết kế lại theo phong cách flat minimal (text-first)**: bỏ card/shadow/viền dày của Claymorphism, phân tách section bằng kẻ mảnh 1px, siết padding — danh sách domain dày hơn, thấy nhiều trang hơn không cần cuộn; #ffd300 giữ vai trò màu nhấn duy nhất; chiều rộng popup 650px → 560px
- **Xóa content script**: không còn inject `content.js` vào mọi trang web — chặn bằng declarativeNetRequest redirect ở tầng network
- **`script.js` (737 dòng) tách thành các ES module** trong `popup/` (mỗi file <200 dòng): domain-list-view, domain-add-form, batch-pause-controls, statistics-view, settings-import-export, popup-main
- **Logic khung giờ dùng chung** chuyển vào `shared/time-window-rules.js` (background + popup dùng chung, hết trùng lặp code)
- **Permissions**: thêm `alarms`, `declarativeNetRequestWithHostAccess`; CSP không còn host ngoài
- **Dữ liệu người dùng giữ nguyên 100%**: schema `blockedDomains`/`statistics`/`pauseEndTime` không đổi — nâng cấp từ v1.2 và file backup cũ hoạt động bình thường

---

## [1.2.0] - 2025-12-09

### 🎨 UI/UX - Thiết kế lại hoàn toàn (Educational Platform Theme)

#### Added
- **Phong cách Claymorphism Educational**: Áp dụng design system mới với soft 3D effects, chunky borders, và playful aesthetics
- **Typography mới**:
  - Google Fonts: Poppins (headings) + Open Sans (body)
  - Font weights: 400, 500, 600, 700
- **Color System hoàn chỉnh**:
  - Primary: #ffd300 (D-Solutions Yellow) - giữ nguyên brand identity
  - Secondary: #4F46E5, #818CF8 (Educational Purple)
  - Semantic colors: Success, Error, Warning với màu sắc educational
- **SVG Icons**: Thay thế hoàn toàn emoji bằng Feather Icons style
  - Consistent sizing (20x20 cho buttons, 24x24 cho stats)
  - Proper stroke-width và accessibility
- **Accessibility improvements**:
  - High contrast text (4.5:1+)
  - Focus visible states (3px outline)
  - ARIA labels cho tất cả interactive elements
  - prefers-reduced-motion support
  - Proper keyboard navigation

#### Changed
- **Layout Structure**:
  - Header đơn giản hơn (chỉ logo + title)
  - Pause container di chuyển ngay dưới control card
  - Import/Export di chuyển xuống cuối trang
  - Responsive 2-row layout cho domain items
- **Dimensions**:
  - Width: 500px → 555px
  - Padding tối ưu: 20px → 16px
  - Margins consistent: 16px
- **Domain List**:
  - Grid layout 2 dòng (row 1: toggle + name + delete, row 2: time + weekdays)
  - Domain name: font-size 15px, font-weight 600
  - Time inputs có border và background rõ ràng
  - Weekday display với background màu tím educational
- **Weekday Selector**:
  - Nowrap layout (tất cả 7 ngày trên 1 dòng)
  - Compact spacing: gap 6px, padding 6px 8px
  - Font-size: 13px → 12px
- **Components**:
  - Form padding: 24px → 20px
  - Section margins: 20px → 16px
  - All cards với border 3px (chunky style)
  - Claymorphism shadows (soft, hover, pressed)

#### Visual Design
- **Cards**: Rounded corners (16-20px), soft shadows, 3px borders
- **Buttons**:
  - Primary button với màu vàng #ffd300
  - Hover effects: translateY(-2px) + shadow-hover
  - Active states: pressed effects với inset shadow
- **Stats Grid**:
  - Icons với colored backgrounds
  - Hover effects cho mỗi stat block
  - Grid layout 2 columns
- **Interactions**:
  - Smooth transitions (200ms ease-out)
  - Cursor pointer cho tất cả clickable elements
  - No layout shift on hover

### 📱 Responsive
- Breakpoint: 555px
- Mobile-friendly layout
- Stats grid chuyển 1 column
- Control card stack vertically
- Weekday selector wrap khi cần

### 🔧 Technical
- CSS Variables cho toàn bộ color system
- Organized CSS structure với comments
- Focus visible for keyboard navigation
- No emojis, chỉ dùng SVG icons

---

## [1.1.2] - Previous Version

### Fixed
- Các lỗi validation và edge cases
- Lỗi chặn website không kiểm tra thời gian và ngày
- Lỗi extension Working Time

### Changed
- Cập nhật phiên bản lên 1.1.2

---

## Semantic Versioning

Format: [MAJOR.MINOR.PATCH]

- **MAJOR**: Breaking changes
- **MINOR**: New features, UI updates (backwards compatible)
- **PATCH**: Bug fixes, small improvements
