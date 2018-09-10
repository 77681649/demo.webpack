import React from "react";
import ReactDOM from "react-dom";

function IndexPage() {
  return <h1>Index Page SS</h1>;
}

ReactDOM.render(<IndexPage />, document.getElementById("root"));

// 5. 加入替换逻辑
if (module.hot) {
  module.hot.accept();
}
