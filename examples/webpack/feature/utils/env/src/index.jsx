import React from "react";
import ReactDOM from "react-dom";

function IndexPage() {
  // 使用全局变量区分环境
  if(process.env.NODE_ENV === 'production'){
    return <h1>Index Page [Production]</h1>;
  } else {
    return <h1>Index Page [Development]</h1>
  }
}

ReactDOM.render(<IndexPage />, document.getElementById("root"));

// 5. 加入替换逻辑
if (module.hot) {
  module.hot.accept();
}
