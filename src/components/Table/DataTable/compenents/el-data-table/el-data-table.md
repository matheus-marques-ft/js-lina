## Extra feature

### searchForm

In addition to the existing el-form-renderer form item configuration, each form item can also add the following configuration,

#### searchImmediately

When the form item changes, immediately fetch the new table data.

```diff
const content = [
  {
    id: 'name',
    type: 'input',
    label: 'name',
+   searchImmediately: true
  }
]
```

#### collapsible

When `canSearchCollapse` collapsible form is enabled, you can set specific form items to be non-collapsible (always shown regardless of collapsed state).

```diff
const content = [
  {
    id: 'name',
    type: 'input',
    label: 'name',
+   collapsible: false
  }
]
```
