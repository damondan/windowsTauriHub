export const borderNTextNBg = {
  lightBorder: 'border border-white/30',
  darkBorder: 'border border-gray-700',
  whiteBorder: 'border border-white',
  lightText: 'text-white/50',
  whiteText: 'text-white',
  whiteBorderShadow: 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]',
  blackBorderShadow: 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]',
  collapseRows: 'h-0 min-h-0 max-h-0 p-0 m-0 opacity-0 overflow-hidden border-0 flex-none scale-y-0 origin-top',
} as const;

export const buttonStyles = {
    circleLightHover: 'border-2 border-gray-500 hover:border-white',
    deleteButton: 'bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors',
    greenButton: 'bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white px-3 py-1 rounded-lg transition-colors',
    largeGreenButton: 'bg-green-500/20 hover:bg-green-500 float-right text-green-500 hover:text-white w-10 h-10 mt-0 mr-6 rounded-lg font-bold text-2xl transition-colors'
} as const;