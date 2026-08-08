/**
 * Multi-select strategy interface
 */
class StrategyAbstract {
  constructor(elDataTable) {
    this.elDataTable = elDataTable
    this.onSelectionChange = this.onSelectionChange.bind(this)
    this.onSelect = this.onSelect.bind(this)
    this.onSelectAll = this.onSelectAll.bind(this)
  }

  get elTable() {
    return this.elDataTable.$refs.table
  }

  onSelectionChange() {}
  onSelect() {}
  onSelectAll() {}
  toggleRowSelection() {}
  clearSelection() {}
  updateElTableSelection() {}
}

/**
 * Normal strategy. el-table maintains the selection itself
 */
class StrategyNormal extends StrategyAbstract {
  onSelectionChange(val) {
    this.elDataTable.selected = val
  }

  toggleRowSelection(...args) {
    return this.elTable.toggleRowSelection(...args)
  }

  clearSelection() {
    return this.elTable?.clearSelection()
  }
}

/**
 * Cross-page persistent multi-select strategy
 */
class StrategyPersistSelection extends StrategyAbstract {
  onSelect(selection, row) {
    const isChosen = selection.indexOf(row) > -1
    this.toggleRowSelection(row, isChosen)
    // el-table's native selection-change only contains the current page. To keep
    // cross-page selection working, sync the "full selected set" to the outside
    // after the internal strategy has finished updating selected.
    this.elDataTable.$emit('selection-change', this.elDataTable.selected)
  }

  onSelectAll(selection, selectable = () => true) {
    const { id, selected, data } = this.elDataTable
    const selectableRows = data.filter(selectable)

    const selectedIds = new Set(selected.map((r) => r[id]))
    const currentPageIds = new Set(selectableRows.map((row) => row[id]))

    const currentPageSelectedCount = selectableRows.filter((row) => selectedIds.has(row[id])).length

    const shouldSelectAll = currentPageSelectedCount < selectableRows.length

    this.elTable?.clearSelection()

    if (shouldSelectAll) {
      selectableRows.forEach((row) => {
        if (!selectedIds.has(row[id])) selected.push(row)
        this.elTable.toggleRowSelection(row, true)
        this.elDataTable.$emit('toggle-row-selection', true, row)
      })
    } else {
      const newSelected = []
      selected.forEach((row) => {
        if (!currentPageIds.has(row[id])) {
          newSelected.push(row)
        } else {
          this.elDataTable.$emit('toggle-row-selection', false, row)
        }
      })
      this.elDataTable.selected = newSelected
    }

    this.elDataTable.$emit('selection-change', this.elDataTable.selected)
  }

  toggleRowSelection(row, isSelected) {
    const { id, selected } = this.elDataTable
    const foundIndex = selected.findIndex((r) => r[id] === row[id])

    if (typeof isSelected === 'undefined') {
      isSelected = foundIndex <= -1
    }

    if (isSelected && foundIndex === -1) {
      selected.push(row)
    } else if (!isSelected && foundIndex > -1) {
      selected.splice(foundIndex, 1)
    }

    this.elDataTable.$emit('toggle-row-selection', isSelected, row)
    this.updateElTableSelection()
    // Sync the full selection (across pages) after toggling
    this.elDataTable.$emit('selection-change', this.elDataTable.selected)
  }

  clearSelection() {
    this.elDataTable.selected = []
    this.updateElTableSelection()
    // Also sync to the outside after clearing, to keep the outer state consistent
    this.elDataTable.$emit('selection-change', this.elDataTable.selected)
  }

  updateElTableSelection() {
    const { data, id, selected } = this.elDataTable
    const selectedIds = new Set(selected.map((r) => r[id]))
    this.elTable?.clearSelection()

    data.forEach((row) => {
      const shouldBeSelected = selectedIds.has(row[id])
      if (shouldBeSelected) {
        this.elTable.toggleRowSelection(row, true)
      }
    })
  }
}

export default function getSelectStrategy(elDataTable) {
  return elDataTable.persistSelection
    ? new StrategyPersistSelection(elDataTable)
    : new StrategyNormal(elDataTable)
}
