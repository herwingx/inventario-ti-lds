/**
 * @fileoverview PrimeVue PassThrough Preset para Tailwind CSS.
 * Define las clases de Tailwind para cada componente PrimeVue en modo unstyled.
 */

const TailwindPreset = {
  // InputText
  inputtext: {
    root: ({ props }) => ({
      class: [
        'w-full bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2.5 px-3',
        'transition-colors duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'placeholder:text-gray-400',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white dark:placeholder:text-gray-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        { 'border-red-500': props?.invalid }
      ]
    })
  },

  // Textarea
  textarea: {
    root: ({ props }) => ({
      class: [
        'w-full bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2.5 px-3',
        'transition-colors duration-200 resize-y min-h-[100px]',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white',
        { 'border-red-500': props?.invalid }
      ]
    })
  },

  // Password
  password: {
    root: { class: 'relative w-full' },
    input: ({ props }) => ({
      class: [
        'w-full bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2.5 px-3 pr-10',
        'transition-colors duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white',
        { 'border-red-500': props?.invalid }
      ]
    }),
    showIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300' },
    hideIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300' }
  },

  // Select (Dropdown)
  select: {
    root: ({ props }) => ({
      class: [
        'relative flex items-center cursor-pointer w-full',
        'bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2.5 px-3',
        'transition-colors duration-200',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white',
        { 'border-red-500': props?.invalid }
      ]
    }),
    label: ({ props }) => ({
      class: [
        'block truncate flex-1',
        { 'text-gray-400 dark:text-gray-500': props?.placeholder && !props?.modelValue }
      ]
    }),
    dropdown: { class: 'ml-2 text-gray-400 dark:text-gray-500' },
    overlay: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-xl mt-1 overflow-hidden' },
    header: { class: 'p-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg' },
    filterInput: { class: 'w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 dark:text-white' },
    filterContainer: { class: 'relative' },
    filterIcon: { class: 'absolute top-1/2 -translate-y-1/2 left-3 text-gray-400' },
    listContainer: { class: 'max-h-60 overflow-auto' },
    list: { class: 'py-1' },
    optionGroup: { class: 'px-3 py-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-dark-bg' },
    option: ({ context }) => ({
      class: [
        'px-3 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-2',
        'text-gray-700 dark:text-gray-200',
        {
          'bg-gray-100 dark:bg-white/10': context?.focused,
          'bg-primary/10 text-primary font-semibold dark:bg-primary/20': context?.selected
        }
      ]
    }),
    emptyMessage: { class: 'px-3 py-4 text-gray-500 dark:text-gray-400 text-center text-sm' },
    clearIcon: { class: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer ml-1' }
  },

  // MultiSelect  
  multiselect: {
    root: ({ props }) => ({
      class: [
        'relative flex items-center cursor-pointer w-full',
        'bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2 px-3 min-h-[42px]',
        'transition-colors duration-200',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white',
        { 'border-red-500': props?.invalid }
      ]
    }),
    labelContainer: { class: 'flex flex-1 flex-wrap gap-1 items-center' },
    label: ({ props }) => ({
      class: [
        'block truncate',
        { 'text-gray-400 dark:text-gray-500': props?.placeholder && (!props?.modelValue || props?.modelValue?.length === 0) }
      ]
    }),
    token: { class: 'inline-flex items-center gap-1 bg-primary/10 dark:bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium' },
    tokenLabel: { class: '' },
    removeTokenIcon: { class: 'w-3 h-3 cursor-pointer hover:text-primary-hover' },
    dropdown: { class: 'ml-2 text-gray-400 dark:text-gray-500' },
    overlay: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-xl mt-1 overflow-hidden' },
    header: { class: 'p-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg' },
    headerCheckboxContainer: { class: 'mr-2' },
    headerCheckbox: {
      root: { class: 'relative inline-flex items-center justify-center w-5 h-5 cursor-pointer' },
      box: ({ context }) => ({
        class: [
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
          {
            'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg': !context?.checked,
            'border-primary bg-primary': context?.checked
          }
        ]
      }),
      icon: { class: 'text-white text-xs' }
    },
    filterInput: { class: 'w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 dark:text-white' },
    filterContainer: { class: 'relative flex-1' },
    filterIcon: { class: 'absolute top-1/2 -translate-y-1/2 left-3 text-gray-400' },
    listContainer: { class: 'max-h-60 overflow-auto' },
    list: { class: 'py-1' },
    optionGroup: { class: 'px-3 py-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-dark-bg' },
    option: ({ context }) => ({
      class: [
        'px-3 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-3',
        'text-gray-700 dark:text-gray-200',
        {
          'bg-gray-100 dark:bg-white/10': context?.focused
        }
      ]
    }),
    optionCheckbox: {
      root: { class: 'relative inline-flex items-center justify-center w-5 h-5 cursor-pointer flex-shrink-0' },
      box: ({ context }) => ({
        class: [
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
          {
            'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg': !context?.checked,
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
        'w-full bg-gray-50 border border-gray-300 rounded-lg',
        'text-gray-900 text-sm py-2.5 px-3',
        'transition-colors duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
        'dark:bg-dark-bg dark:border-dark-border dark:text-white',
        { 'border-red-500': props?.invalid }
      ]
    }),
    dropdownButton: { class: 'absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-primary cursor-pointer' },
    panel: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl p-4 min-w-[280px]' },
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
          'bg-primary text-white font-bold hover:bg-primary': context?.selected,
          'bg-primary/10 text-primary': context?.today && !context?.selected,
          'text-gray-300 dark:text-gray-600 cursor-default': context?.disabled,
          'text-gray-400 dark:text-gray-600': context?.otherMonth
        }
      ]
    }),
    monthView: { class: 'grid grid-cols-3 gap-2 mt-2' },
    month: ({ context }) => ({
      class: [
        'py-2 px-3 rounded-lg text-center text-sm cursor-pointer transition-colors',
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5',
        { 'bg-primary text-white font-bold hover:bg-primary': context?.selected }
      ]
    }),
    yearView: { class: 'grid grid-cols-3 gap-2 mt-2' },
    year: ({ context }) => ({
      class: [
        'py-2 px-3 rounded-lg text-center text-sm cursor-pointer transition-colors',
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5',
        { 'bg-primary text-white font-bold hover:bg-primary': context?.selected }
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
    root: { class: 'bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-4' },
    header: { class: 'bg-white dark:bg-dark-card text-gray-900 dark:text-white px-6 py-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between' },
    title: { class: 'text-lg font-bold' },
    headerActions: { class: 'flex items-center gap-2' },
    maximizableButton: { class: 'w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer transition-colors' },
    closeButton: { class: 'w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer transition-colors' },
    closeButtonIcon: { class: '' },
    content: { class: 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 px-6 py-6' },
    footer: { class: 'bg-gray-50 dark:bg-dark-bg/50 px-6 py-4 border-t border-gray-100 dark:border-dark-border flex justify-end gap-3' }
  },

  // ConfirmDialog
  confirmdialog: {
    root: { class: 'bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl w-full max-w-md mx-4' },
    header: { class: 'hidden' },
    content: { class: 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 px-6 py-8 flex flex-col items-center text-center gap-4' },
    icon: { class: 'text-5xl' },
    message: { class: 'text-lg font-bold text-gray-800 dark:text-gray-100' },
    footer: { class: 'bg-gray-50 dark:bg-dark-bg/50 px-6 py-4 border-t border-gray-100 dark:border-dark-border flex justify-center gap-3' },
    acceptButton: { class: 'btn-primary' },
    rejectButton: { class: 'btn-secondary' }
  },

  // Toast
  toast: {
    root: { class: 'fixed z-[1200] w-80' },
    message: ({ props }) => ({
      class: [
        'bg-white dark:bg-dark-card rounded-xl shadow-xl border p-4 mb-3 flex items-start gap-3',
        {
          'border-emerald-200 dark:border-emerald-500/30': props?.message?.severity === 'success',
          'border-blue-200 dark:border-blue-500/30': props?.message?.severity === 'info',
          'border-amber-200 dark:border-amber-500/30': props?.message?.severity === 'warn',
          'border-red-200 dark:border-red-500/30': props?.message?.severity === 'error',
          'border-gray-100 dark:border-dark-border': !props?.message?.severity
        }
      ]
    }),
    messageContent: { class: 'flex-1' },
    messageIcon: ({ props }) => ({
      class: [
        'text-xl flex-shrink-0',
        {
          'text-emerald-500': props?.message?.severity === 'success',
          'text-blue-500': props?.message?.severity === 'info',
          'text-amber-500': props?.message?.severity === 'warn',
          'text-red-500': props?.message?.severity === 'error'
        }
      ]
    }),
    summary: { class: 'font-bold text-gray-900 dark:text-white' },
    detail: { class: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
    closeButton: { class: 'w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer ml-auto flex-shrink-0' },
    closeIcon: { class: '' }
  },

  // Tag
  tag: {
    root: ({ props }) => ({
      class: [
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border',
        {
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20': props?.severity === 'success',
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20': props?.severity === 'info',
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20': props?.severity === 'warn' || props?.severity === 'warning',
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20': props?.severity === 'danger',
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20': props?.severity === 'secondary' || !props?.severity
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
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
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
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        { 'rounded-full': props?.shape === 'circle', 'rounded': props?.shape !== 'circle' }
      ]
    })
  },

  // InputNumber  
  inputnumber: {
    root: { class: 'relative w-full' },
    input: {
      root: ({ props }) => ({
        class: [
          'w-full bg-gray-50 border border-gray-300 rounded-lg',
          'text-gray-900 text-sm py-2.5 px-3',
          'transition-colors duration-200',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          'dark:bg-dark-bg dark:border-dark-border dark:text-white',
          { 'border-red-500': props?.invalid }
        ]
      })
    },
    buttonGroup: { class: 'absolute right-0 top-0 h-full flex flex-col' },
    incrementButton: { class: 'h-1/2 px-2 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-tr-lg border-l border-b border-gray-300 dark:border-dark-border' },
    decrementButton: { class: 'h-1/2 px-2 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-br-lg border-l border-gray-300 dark:border-dark-border' }
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
