export const LAYOUT = {
  sidebarWidth:          224,  // px — expanded (w-56)
  sidebarWidthCollapsed:  56,  // px — icon-only (w-14)
  headerHeight:           56,  // px — h-14
  pageMaxWidth:         1440,  // px — max-w-screen-2xl
  contentPadding:         24,  // px — p-6
  contentPaddingMobile:   16,  // px — p-4
  tableRowHeight:         44,  // px — mínimo touch-safe
  chartHeight: {
    sparkline:  48,
    compact:   180,
    standard:  260,
    tall:      340,
    full:      420,
  },
} as const

export const Z_INDEX = {
  base:          0,
  dropdown:     10,
  tableSticky:  20,
  sidebar:      30,
  modal:        50,
  toast:       100,
} as const
