# columnDefs

```js
1.
headerStyle、cellStyle：
{
  color: 'red',
  fontSize: '16px'
}
或者
params =>
{
  color: 'red',
  fontSize: '16px'
}
```

2.

```js
headerClass、
cellClass：
{
  'aclass': true,
  'bclass': false
}
或者
params => {
  'aclass': true,
  'bclass': false
}
```

3.

```js
cellRenderer: 'ComponentA'; // 只有一个字符串时传组件名
cellRenderer: (params) => {
  // 为函数时返回值当html处理
  return `<div style='color: red'>自定义的一些字...</div>`;
};
cellRendererSelector: (params) => {
  return {
    component: 'ComponentA',
    params: { a: 1, b: 2 }, // 自定义传入组件的参数
  };
};
```

4.对齐

```js
align: 'left' | 'center' | 'right';
```
