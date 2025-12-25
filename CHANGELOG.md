# Changelog - Working Time Extension

Tất cả các thay đổi quan trọng của dự án sẽ được ghi lại trong file này.

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
