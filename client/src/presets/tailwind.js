/**
 * @fileoverview PrimeVue PassThrough Preset para Tailwind CSS.
 * Define las clases de Tailwind para cada componente PrimeVue en modo unstyled.
 */

const TailwindPreset = {
  // IconField
  iconfield: {
    root: { class: 'relative flex items-center' }
  },
  inputicon: {
    root: (slotProps) => {
      const context = slotProps.context || {};
      const parent = slotProps.parent || {};
      const props = slotProps.props || {};

      // Defensive check for position
      const isLeft = (context.position === 'left') || (parent.props && parent.props.iconPosition === 'left');
      const isRight = (context.position === 'right') || (parent.props && parent.props.iconPosition === 'right');
      // Default to right if indeterminate and not explicitly left
      const defaultPos = !isLeft;

      return {
        class: [
          'absolute top-1/2 -translate-y-1/2',
          {
            'left-3': isLeft,
            'right-3': isRight || defaultPos
          },
          'text-gray-400 dark:text-gray-500'
        ]
      };
    }
  },

  // InputText
  // InputText
  inputtext: {
    root: ({ props }) => ({
      class: [
        'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3', // Comfortable spacing
        'transition-all duration-200', // Smooth transition
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none', // Premium focus ring
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-800',
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid } // Error state
      ]
    })
  },

  // Textarea
  textarea: {
    root: ({ props }) => ({
      class: [
        'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3',
        'transition-all duration-200 resize-y min-h-[100px]',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-800',
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
      ]
    })
  },

  // Password
  password: {
    root: { class: 'relative inline-flex w-full' },
    pcInputText: ({ props }) => ({
      class: [
        'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3 pr-10',
        'transition-all duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-800',
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
      ]
    }),
    maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer dark:text-gray-500 dark:hover:text-primary transition-colors z-10' },
    unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer dark:text-gray-500 dark:hover:text-primary transition-colors z-10' },
    // Overlay para el indicador de fortaleza
    overlay: { class: 'absolute left-0 top-full mt-2 w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-xl p-3 z-50' },
    content: { class: 'flex flex-col gap-2' },
    meter: { class: 'h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden' },
    meterLabel: ({ instance }) => ({
      class: [
        'h-full rounded-full transition-all duration-300',
        {
          'bg-red-500': instance?.meter?.strength === 'weak',
          'bg-amber-500': instance?.meter?.strength === 'medium',
          'bg-emerald-500': instance?.meter?.strength === 'strong'
        }
      ]
    }),
    meterText: { class: 'text-xs font-medium text-gray-600 dark:text-gray-400' }
  },

  // Select (Dropdown)
  select: {
    root: ({ props }) => ({
      class: [
        'relative flex items-center cursor-pointer w-full',
        'bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3',
        'transition-all duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none focus:z-10', // Added focus states to root
        'hover:border-gray-400 dark:hover:border-gray-600', // Hover effect
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
      ]
    }),
    label: ({ props }) => ({
      class: [
        'block truncate flex-1',
        { 'text-gray-400 dark:text-gray-500': props?.placeholder && !props?.modelValue }
      ]
    }),
    dropdown: { class: 'ml-2 text-gray-400 dark:text-gray-500' },
    overlay: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-xl mt-1 overflow-hidden z-[1000]' }, // High z-index
    header: { class: 'p-3 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50' },
    // Fixed: Adjusted padding for Right-aligned icon to match MultiSelect
    filterInput: { class: 'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 dark:text-white transition-colors' },
    filterContainer: { class: 'relative w-full' },
    filterIcon: { class: 'absolute top-1/2 -translate-y-1/2 right-3 text-gray-400' },
    listContainer: { class: 'max-h-60 overflow-auto' },
    list: { class: 'py-1' },
    optionGroup: { class: 'px-3 py-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-dark-bg' },
    option: ({ context }) => ({
      class: [
        'px-3 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-2 text-sm',
        'text-gray-700 dark:text-gray-200',
        {
          'bg-gray-100 dark:bg-white/5': context?.focused,
          'bg-primary/10 text-primary font-semibold dark:bg-primary/20': context?.selected
        }
      ]
    }),
    emptyMessage: { class: 'px-3 py-4 text-gray-500 dark:text-gray-400 text-center text-sm' },
    clearIcon: { class: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer ml-1' }
  },

  // MultiSelect  
  // MultiSelect  
  multiselect: {
    root: ({ props }) => ({
      class: [
        'relative flex items-center cursor-pointer w-full',
        'bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm p-1', // Reduced padding to let tokens handle spacing
        'min-h-[42px]',
        'transition-all duration-200',
        'hover:border-gray-400 dark:hover:border-gray-600',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none focus:z-10', // Focus ring
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
      ]
    }),
    labelContainer: { class: 'flex flex-wrap gap-1.5 items-center overflow-hidden w-full px-2 py-1' },
    label: ({ props }) => ({
      class: [
        'block truncate py-1',
        { 'text-gray-400 dark:text-gray-500': props?.placeholder && (!props?.modelValue || props?.modelValue?.length === 0) }
      ]
    }),
    token: {
      class: 'flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 rounded-md text-xs font-bold max-w-full'
    },
    tokenLabel: { class: 'truncate min-w-0 flex-1' }, // min-w-0 allows flex truncation
    removeTokenIcon: { class: 'w-3.5 h-3.5 cursor-pointer hover:text-primary-hover flex-shrink-0' },
    dropdown: { class: 'ml-auto mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0' },
    overlay: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-xl mt-1 overflow-hidden z-[1000]' },
    header: { class: 'p-3 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 w-full' },
    headerCheckboxContainer: { class: '!hidden w-0 h-0 overflow-hidden opacity-0 pointer-events-none' }, // Nuclear option to hide it
    headerCheckbox: {
      root: { class: '!hidden' },
      box: { class: '!hidden' },
      input: { class: '!hidden' },
      icon: { class: '!hidden' }
    },
    // PrimeVue 4 uses pcHeaderCheckbox as the slot name for the header checkbox component
    pcHeaderCheckbox: {
      root: { class: '!hidden' },
      box: { class: '!hidden' },
      input: { class: '!hidden' },
      icon: { class: '!hidden' }
    },
    // Fixed: Adjusted padding for Right-aligned icon as per user screenshot preference
    filterInput: { class: 'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 dark:text-white transition-colors' },
    filterContainer: { class: 'relative w-full' },
    filterIcon: { class: 'absolute top-1/2 -translate-y-1/2 right-3 text-gray-400' }, // Moved to right to match screenshot
    listContainer: { class: 'max-h-60 overflow-auto' },
    list: { class: 'py-1' },
    optionGroup: { class: 'px-3 py-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-dark-bg' },
    option: ({ context }) => ({
      class: [
        'px-3 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-3 text-sm relative',
        'text-gray-700 dark:text-gray-200',
        {
          'bg-gray-100 dark:bg-white/5': context?.focused,
          'bg-primary/5 dark:bg-primary/10 text-primary font-medium': context?.selected // Highlight selected in list
        }
      ]
    }),
    optionCheckbox: {
      root: { class: 'relative inline-flex items-center justify-center w-5 h-5 cursor-pointer flex-shrink-0' },
      box: ({ context }) => ({
        class: [
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
          {
            'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg group-hover:border-primary': !context?.checked,
            'border-primary bg-primary': context?.checked
          }
        ]
      }),
      icon: { class: 'text-white text-xs' }
    },
    emptyMessage: { class: 'px-3 py-4 text-gray-500 dark:text-gray-400 text-center text-sm' },
    clearIcon: { class: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer ml-1' }
  },

  // Checkbox
  checkbox: {
    root: { class: 'relative inline-flex items-center justify-center w-5 h-5 cursor-pointer' },
    box: ({ context }) => ({
      class: [
        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
        {
          'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg hover:border-primary': !context?.checked,
          'border-primary bg-primary': context?.checked
        }
      ]
    }),
    input: { class: 'sr-only' },
    icon: { class: 'text-white text-xs' }
  },

  // RadioButton
  radiobutton: {
    root: { class: 'relative inline-flex items-center justify-center w-5 h-5 cursor-pointer' },
    box: ({ context }) => ({
      class: [
        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
        {
          'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg hover:border-primary': !context?.checked,
          'border-primary bg-primary': context?.checked
        }
      ]
    }),
    input: { class: 'sr-only' },
    icon: ({ context }) => ({
      class: [
        'w-2 h-2 rounded-full bg-white transition-all duration-200',
        { 'opacity-100 scale-100': context?.checked, 'opacity-0 scale-0': !context?.checked }
      ]
    })
  },

  // DatePicker
  datepicker: {
    root: { class: 'relative w-full' },
    input: ({ props }) => ({
      class: [
        'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
        'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3',
        'transition-all duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
      ]
    }),
    dropdownButton: { class: 'absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-primary cursor-pointer transition-colors' },
    panel: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl p-4 min-w-[280px] z-50' },
    header: { class: 'flex items-center justify-between mb-4' },
    title: { class: 'flex items-center gap-1' },
    previousButton: { class: 'w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary cursor-pointer dark:text-gray-400 dark:hover:bg-white/5 transition-colors' },
    monthTitle: { class: 'font-bold text-gray-800 dark:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors' },
    yearTitle: { class: 'font-bold text-gray-800 dark:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors' },
    nextButton: { class: 'w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary cursor-pointer dark:text-gray-400 dark:hover:bg-white/5 transition-colors' },
    dayView: { class: 'w-full' },
    week: { class: '' },
    weekHeader: { class: '' },
    weekHeaderCell: { class: 'text-xs font-bold uppercase text-gray-400 py-2 text-center' },
    weekDay: { class: '' },
    weekDays: { class: '' },
    dayCell: { class: 'p-0.5 text-center' },
    day: ({ context }) => ({
      class: [
        'w-9 h-9 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-all',
        'hover:bg-gray-100 dark:hover:bg-white/5',
        {
          'text-gray-700 dark:text-gray-300': !context?.selected && !context?.disabled,
          'bg-primary text-white font-bold hover:bg-primary shadow-sm': context?.selected,
          'bg-primary/10 text-primary font-semibold': context?.today && !context?.selected,
          'text-gray-300 dark:text-gray-600 cursor-default hover:bg-transparent': context?.disabled,
          'text-gray-400 dark:text-gray-600': context?.otherMonth
        }
      ]
    }),
    monthView: { class: 'grid grid-cols-3 gap-2 mt-2' },
    month: ({ context }) => ({
      class: [
        'py-2 px-3 rounded-lg text-center text-sm cursor-pointer transition-colors',
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5',
        { 'bg-primary text-white font-bold hover:bg-primary shadow-md': context?.selected }
      ]
    }),
    yearView: { class: 'grid grid-cols-3 gap-2 mt-2' },
    year: ({ context }) => ({
      class: [
        'py-2 px-3 rounded-lg text-center text-sm cursor-pointer transition-colors',
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5',
        { 'bg-primary text-white font-bold hover:bg-primary shadow-md': context?.selected }
      ]
    }),
    timePicker: { class: 'flex items-center justify-center gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-dark-border' },
    hourPicker: { class: 'flex flex-col items-center' },
    minutePicker: { class: 'flex flex-col items-center' },
    secondPicker: { class: 'flex flex-col items-center' },
    separator: { class: 'text-gray-400 font-bold text-xl mx-2' },
    incrementButton: { class: 'w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer' },
    decrementButton: { class: 'w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer' },
    hour: { class: 'text-lg font-bold text-gray-800 dark:text-white py-1' },
    minute: { class: 'text-lg font-bold text-gray-800 dark:text-white py-1' },
    second: { class: 'text-lg font-bold text-gray-800 dark:text-white py-1' },
    ampm: { class: 'ml-2' },
    buttonbar: { class: 'flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-dark-border' }
  },

  // Dialog
  dialog: {
    mask: { class: 'fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[1000]' },
    root: { class: 'bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-4 border border-gray-100 dark:border-dark-border' },
    header: { class: 'bg-white dark:bg-dark-card text-gray-900 dark:text-white px-6 py-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between' },
    title: { class: 'text-lg font-bold' },
    headerActions: { class: 'flex items-center gap-2' },
    maximizableButton: { class: 'w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer transition-colors' },
    closeButton: { class: 'w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer transition-colors' },
    closeButtonIcon: { class: '' },
    content: { class: 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 px-6 py-6' },
    footer: { class: 'bg-gray-50 dark:bg-dark-bg/50 px-6 py-4 border-t border-gray-100 dark:border-dark-border flex justify-end gap-3' }
  },

  // ConfirmDialog - Layout base, colores de botones controlados via CSS global
  confirmdialog: {
    root: { class: 'bg-light-card dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl w-full max-w-md mx-4 border border-light-border dark:border-dark-border' },
    header: { class: 'px-6 pt-6 pb-2 flex items-center justify-between' },
    headerTitle: { class: 'text-xl font-bold text-light-text dark:text-dark-text' },
    content: { class: 'bg-light-card dark:bg-dark-card px-6 py-4 flex items-start gap-4' },
    icon: { class: 'text-3xl text-warning flex-shrink-0' },
    message: { class: 'text-light-muted dark:text-dark-muted text-sm leading-relaxed' },
    footer: { class: 'bg-light-bg dark:bg-dark-bg/50 px-6 py-4 border-t border-light-border dark:border-dark-border flex justify-end gap-3' }
  },

  // Toast
  toast: {
    root: { class: 'fixed z-[1200] w-96 right-5 top-5' },
    message: ({ props }) => ({
      class: [
        'rounded-xl shadow-lg border p-4 mb-3 flex items-start gap-3 transform transition-all',
        {
          'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-dark-card dark:border-emerald-500 dark:text-emerald-400 dark:shadow-emerald-500/10': props?.message?.severity === 'success',
          'bg-blue-100 border-blue-200 text-blue-800 dark:bg-dark-card dark:border-blue-500 dark:text-blue-400 dark:shadow-blue-500/10': props?.message?.severity === 'info',
          'bg-amber-100 border-amber-200 text-amber-800 dark:bg-dark-card dark:border-amber-500 dark:text-amber-400 dark:shadow-amber-500/10': props?.message?.severity === 'warn',
          'bg-red-100 border-red-200 text-red-800 dark:bg-dark-card dark:border-red-500 dark:text-red-400 dark:shadow-red-500/10': props?.message?.severity === 'error',
          'bg-white border-gray-100 text-gray-600 dark:bg-dark-card dark:border-dark-border dark:text-gray-300': !props?.message?.severity
        }
      ]
    }),
    messageContent: { class: 'flex-1' },
    messageIcon: ({ props }) => ({
      class: [
        'text-xl flex-shrink-0 mt-0.5',
        // Text color is now handled by parent, but we can keep explicit or let it inherit
        {
          'text-emerald-600 dark:text-emerald-400': props?.message?.severity === 'success',
          'text-blue-600 dark:text-blue-400': props?.message?.severity === 'info',
          'text-amber-600 dark:text-amber-400': props?.message?.severity === 'warn',
          'text-red-600 dark:text-red-400': props?.message?.severity === 'error'
        }
      ]
    }),
    summary: { class: 'font-bold text-gray-900 dark:text-white block' },
    detail: { class: 'text-sm text-gray-600 dark:text-gray-400 mt-1 block leading-relaxed' },
    closeButton: { class: 'w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer ml-auto flex-shrink-0' },
    closeIcon: { class: '' }
  },

  // Tag
  // Fixed: Updated to SOLID colors for high visibility and eliminated "other color border" issues.
  // Extended with purple, cyan, and slate for more status variety.
  tag: {
    root: ({ props }) => ({
      class: [
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border',
        {
          // PREMIUM SOFT COLORS (High Contrast & Visibility Enforced)
          'bg-emerald-100 !text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:!text-emerald-400 dark:border-emerald-500/30': props?.severity === 'success',
          'bg-blue-100 !text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:!text-blue-400 dark:border-blue-500/30': props?.severity === 'info',
          'bg-amber-100 !text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:!text-amber-400 dark:border-amber-500/30': props?.severity === 'warn' || props?.severity === 'warning',
          'bg-red-100 !text-red-800 border-red-200 dark:bg-red-500/20 dark:!text-red-400 dark:border-red-500/30': props?.severity === 'danger',
          'bg-gray-100 !text-gray-800 border-gray-200 dark:bg-zinc-800 dark:!text-gray-400 dark:border-zinc-700': props?.severity === 'secondary' || !props?.severity,
          'bg-gray-900 !text-white border-gray-900 dark:bg-white dark:!text-black': props?.severity === 'contrast',
          // NEW: Extended color palette for more status variety
          'bg-purple-100 !text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:!text-purple-400 dark:border-purple-500/30': props?.severity === 'purple',
          'bg-cyan-100 !text-cyan-800 border-cyan-200 dark:bg-cyan-500/20 dark:!text-cyan-400 dark:border-cyan-500/30': props?.severity === 'cyan',
          'bg-slate-200 !text-slate-700 border-slate-300 dark:bg-slate-600/20 dark:!text-slate-400 dark:border-slate-500/30': props?.severity === 'slate',
          'bg-pink-100 !text-pink-800 border-pink-200 dark:bg-pink-500/20 dark:!text-pink-400 dark:border-pink-500/30': props?.severity === 'pink',
          'bg-indigo-100 !text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:!text-indigo-400 dark:border-indigo-500/30': props?.severity === 'indigo'
        }
      ]
    }),
    icon: { class: 'text-xs' },
    label: { class: '' }
  },

  // Button
  button: {
    root: ({ props }) => ({
      class: [
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-tight text-sm transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        {
          'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0 active:scale-95 focus:ring-primary': !props?.severity || props?.severity === 'primary',
          'bg-gray-100 text-gray-700 dark:bg-dark-border dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:shadow-md active:scale-95 focus:ring-gray-300': props?.severity === 'secondary',
          'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-red-500/40 active:translate-y-0 active:scale-95 focus:ring-red-500': props?.severity === 'danger',
          'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:-translate-y-0.5 hover:shadow-amber-500/40 active:translate-y-0 active:scale-95 focus:ring-amber-500': props?.severity === 'warning',
          'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-emerald-500/40 active:translate-y-0 active:scale-95 focus:ring-emerald-500': props?.severity === 'success',
          'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:scale-95 focus:ring-blue-500': props?.severity === 'info',
          'bg-transparent shadow-none text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white': props?.text
        }
      ]
    }),
    label: { class: '' },
    icon: { class: '' },
    loadingIcon: { class: 'animate-spin' },
    badge: { class: 'ml-2 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full' }
  },

  // Skeleton
  skeleton: {
    root: ({ props }) => ({
      class: [
        'animate-pulse bg-gray-200 dark:bg-gray-700/50',
        { 'rounded-full': props?.shape === 'circle', 'rounded-lg': props?.shape !== 'circle' }
      ]
    })
  },

  // InputNumber  
  inputnumber: {
    root: { class: 'relative w-full' },
    input: {
      root: ({ props }) => ({
        class: [
          'w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg',
          'text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3',
          'transition-all duration-200',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': props?.invalid }
        ]
      })
    },
    buttonGroup: { class: 'absolute right-0 top-0 h-full flex flex-col' },
    incrementButton: { class: 'h-1/2 px-2 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-tr-lg border-l border-b border-gray-300 dark:border-dark-border transition-colors' },
    decrementButton: { class: 'h-1/2 px-2 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-br-lg border-l border-gray-300 dark:border-dark-border transition-colors' }
  },

  // Message
  message: {
    root: ({ props }) => ({
      class: [
        'flex items-center gap-3 p-4 rounded-xl border',
        {
          'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400': props?.severity === 'success',
          'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400': props?.severity === 'info',
          'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400': props?.severity === 'warn',
          'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400': props?.severity === 'error'
        }
      ]
    }),
    icon: { class: 'text-xl flex-shrink-0' },
    text: { class: 'flex-1' },
    closeButton: { class: 'w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ml-auto' },
    closeIcon: { class: '' }
  }
}

export default TailwindPreset
