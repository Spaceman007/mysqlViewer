# 说明

- 采用 node.js + express + angular.js 开发

- 适合前端操作（增、删、改、查）小型的 mysql，因为没有做分页等功能，如果数据库规模较大则速度会很慢。

- 开发步骤

  - `node.js` + `npm` 环境

  - `npm install` 安装依赖

  - 编辑　`start.js`，配置 mysql 连接

    ```javascript
    var connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'test'
    });
    ```

  - `node start.js`, 开启服务，在浏览器中打开 `localhost:5555`，端口在 `start.js` 中配置。

    ```javascript
    app.set('port', process.env.PORT || 5555);
    ```