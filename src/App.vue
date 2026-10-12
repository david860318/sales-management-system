<!-- src/App.vue -->
<template>
  <router-view />
</template>

<style>
/* 覆蓋 Element Plus 的全域 CSS 變數 */
:root {
  /* 寶寶藍主色調 */
  --el-color-primary: #8cbbf1;
  --el-color-primary-light-3: #a2cbf6;
  --el-color-primary-light-5: #b9daf9;
  --el-color-primary-light-7: #d0e8fc;
  --el-color-primary-light-9: #e7f5fe;
  
  /* 粉嫩輔助色：成功(薄荷綠)、警告(奶油黃)、危險(草莓粉) */
  --el-color-success: #9adbc5;
  --el-color-warning: #f8d579;
  --el-color-danger: #f6a6b2;
  
  /* 全域圓角變大，增加可愛感 */
  --el-border-radius-base: 16px;
  --el-border-radius-small: 12px;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100vh;
  /* 加入圓潤的無襯線字體 */
  font-family: 'Quicksand', 'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f0f7ff; /* 柔和的淡藍色背景 */
  color: #5c738b;
}
</style>