angular.module('myApp', ['ui.bootstrap'])
.controller('myCtrl', function($scope, $uibModal, $http) {

  var dbname = 'test';
  var ktbl = 'Tables_in_' + dbname;

  $scope.options = [];
  $scope.dbs = [];

  $http({
    url: '/query',
    method: 'get',
    params: {
      querykey: 'show databases;'
    }
  }).then(function(res) {
    $scope.dbs = res.data;
    $scope.dbOpt = $scope.dbs[0];
    dbname = $scope.dbOpt.Database;
    ktbl = 'Tables_in_' + dbname;
    execSQL($http, 'use ' + dbname, function () {
      refreshTables();
    })
  });

  function refreshTables () {
    $http({
      url: '/query',
      method: 'get',
      params: {
        querykey: 'show tables;'
      }
    }).then(function (res) {
      $scope.options = res.data;
      $scope.options.forEach(function (itm) {
        itm.name = itm[ktbl]
      })
      $scope.type = $scope.options[0];
      $scope.selectIt();
    })
  }

  $scope.exec = function() {
    var data = {
      querykey: $scope.querykey
    };
    console.log(data);
    query(data);
  };

  $scope.desc = function() {
    var type = $scope.type[ktbl];
    query({
      querykey: "desc " + type
    });
  };

  $scope.toggleAll = function() {
    for (var i=0,n=$scope.xlist.length; i<n; i++) {
      $scope.xlist[i].checked = $scope.all;
    }
  };

  $scope.selectDb = function () {
    console.log($scope.dbOpt);
    dbname = $scope.dbOpt.Database;
    ktbl = 'Tables_in_' + dbname;
    execSQL($http, 'use ' + $scope.dbOpt.Database, function () {
      refreshTables();
    })
  }

  $scope.selectIt = function() {
    $http({
      url: '/select',
      method: 'get',
      params: {
        type: $scope.type[ktbl]
      }
    }).then(function(res) {
      refresh(res.data);
    });
  };

	/* alert */
	$scope.miAlert = function(msg, size) {
		var alertInstance = $uibModal.open({
			animation: true,
			templateUrl: 'myAlert.html',
			controller: 'AlertInstanceCtrl',
			size: size,
			resolve: {
				msg: function() {
          return msg;
				}
			}
		});

		alertInstance.result.then(function(){
		}, function() {
		});
	};

  function getSelectedList() {
    var selist = [];
    for (var i=0,n=$scope.xlist.length; i<n; i++) {
      if ($scope.xlist[i].checked) {
        selist.push($scope.xlist[i]);
      }
    }
    return selist;
  }

  /* 修改 */
  $scope.modify = function() {
    getPriKey(function(prikey) {
      var selArr = getSelectedList();
      if (selArr.length === 0) {
        $scope.miAlert('请选择!');
        return;
      } else if (selArr.length > 1) {
        $scope.miAlert('只能选择一个!');
        return;
      }
      var id = selArr[0][prikey];

      $scope.insert(prikey, id);
    });
  };

  /* 复制 */
  $scope.clone = function() {
    getPriKey(function(prikey) {
      var selArr = getSelectedList();
      if (selArr.length === 0) {
        $scope.miAlert('请选择!');
        return;
      } else if (selArr.length > 1) {
        $scope.miAlert('只能选择一个!');
        return;
      }
      var id = selArr[0][prikey];

      $scope.insert(prikey, id, 'clone');
    });
  };

  /* 删除 */
  $scope.delete = function() {
    getPriKey(function(prikey) {
      var selArr = getSelectedList();
      if (selArr.length === 0) {
        $scope.miAlert('请选择!');
        return;
      }
      var idarr = [];
      var table = $scope.type[ktbl];

      for (var i=0,n=selArr.length; i<n; i++) {
        idarr.push(selArr[i][prikey]);
      }

      $http({
        url: '/query',
        method: 'get',
        params: {
          querykey: 'delete from ' + table + ' where ' + prikey + ' in (' + arr2str(idarr) + ')'
        }
      }).then(function(res) {
        if (res.data.result === 'error') {
          $scope.miAlert('删除失败!');
        } else {
          $scope.miAlert('删除成功!');
          $scope.selectIt();
        }
      });
    });
  };

  function getPriKey(cb) {
    var table = $scope.type[ktbl];
    $http({
      url: '/query',
      method: 'get',
      params: {
        querykey: 'desc ' + table
      }
    }).then(function(res) {
      var prikey;
      if (res.data instanceof Array) {
        for (var i=0,n=res.data.length; i<n; i++) {
          if (res.data[i].Key == 'PRI') {
            prikey = res.data[i].Field;
            break;
          }
        }
      }
      cb(prikey);
      //return prikey;
    });
  }

  /* 插入 */
  $scope.insert = function(prikey, id, type) {
    var alertInstance = $uibModal.open({
      animation: true,
      templateUrl: 'myModal.html',
      controller: 'myModalCtrl',
      size: 'lg',
      resolve: {
        cfg: function() {
          return {
            names: $scope.header,
            table: $scope.type[ktbl],
            parent: $scope,
            prikey: prikey,
            id: id,
            type: type
          };
        }
      }
    });

    alertInstance.result.then(function(){
      $scope.selectIt();
    }, function() {
    });

  };

  function query(cfg) {
    $http({
      url: '/query',
      method: 'get',
      params: cfg
    }).then(function(res) {
      refresh(res.data);
    });
  }

  function refresh(data) {
    $scope.xlist = data;
    selist = [];
    $scope.header = [];
    for (var k in $scope.xlist[0]) {
      $scope.header.push(k);
    }
  }
})
.controller('myModalCtrl', function($scope, $uibModalInstance, $http, cfg) {

  $scope.xlist = [];

  execSQL($http, 'desc '+cfg.table, function(res) {
    var desc = {};
    var i, n;
    if (res.data instanceof Array) {
      for (i=0,n=res.data.length; i<n; i++) {
        desc[res.data[i].Field] = {
          required : res.data[i].Null == 'NO' ? true : false,
          holder: res.data[i].Type + (res.data[i].Key ? ' ==> ' + res.data[i].Key : '')
        };
      }
    }
    if (cfg.names) {
      for (i=0,n=cfg.names.length; i<n; i++) {
        $scope.xlist.push({
          name: cfg.names[i],
          required: desc[cfg.names[i]].required,
          holder: desc[cfg.names[i]].holder
        });
      }
    }

    var querykey = 'select * from ' + cfg.table + ' where ' + cfg.prikey + '=' + cfg.id;
    execSQL($http, querykey, function(res) {
      if (res.data instanceof Array && res.data.length === 1) {
        for (var i=0,n=$scope.xlist.length; i<n; i++) {
          $scope.xlist[i].val = res.data[0][$scope.xlist[i].name];
        }
      }
    });
  });

  $scope.ok = function() {
    var names = [];
    var vals  = [];
    var updatestr = ' set ';

    for (var i=0,n=$scope.xlist.length; i<n; i++) {
      if ($scope.xlist[i].val) {
        //if (cfg.type != 'clone' || cfg.prikey != $scope.xlist[i].name) {
          names.push($scope.xlist[i].name);
          vals.push(JSON.stringify($scope.xlist[i].val));
        //}
        if ($scope.xlist[i].name != cfg.prikey) {
          updatestr += $scope.xlist[i].name + '=' + JSON.stringify($scope.xlist[i].val) + ',';
        }
      }
    }
    updatestr = updatestr.slice(0, updatestr.length - 1) + ' ';
    var sqlstr;
    if (cfg.id && cfg.type != 'clone') {
      sqlstr = 'update ' + cfg.table + updatestr + 'where ' + cfg.prikey + '= ' + cfg.id;
    } else {
      sqlstr = 'insert into ' + cfg.table + '(' + arr2str(names) +')' + ' values(' + arr2str(vals) + ')';
    }
    console.log(sqlstr);
    var resmsg = cfg.id ? '修改' : '插入';
    execSQL($http, sqlstr, function(res) {
      if (res.data.result === 'error') {
        cfg.parent.miAlert(resmsg + '失败');
      } else {
        cfg.parent.miAlert(resmsg + '成功');
      }
      $uibModalInstance.close();
    });
  };
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
.controller('AlertInstanceCtrl', function($scope, $uibModalInstance, msg) {
	$scope.msg = msg;
	$scope.ok = function() {
		$uibModalInstance.dismiss('ok');
	};
});


function execSQL($http, sql, cb) {
  $http({
    url: '/query',
    method: 'get',
    params: {
      querykey: sql
    }
  }).then(function(res) {
    cb(res);
  });
}

/* 数组转为以','分割的字符串 */
function arr2str(arr) {
  return arr.toString()
}
