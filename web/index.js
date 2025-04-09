//WechatRealFriends By StrayMeteor3337
function onError(msg){
    layer.msg(msg, {icon: 2}, function(){});
}


function showQR(QRJson) {
    const QRCode = document.getElementById("QrCode");
    const loadingTip = document.getElementById("loadingTip");
    const uuid = document.getElementById("QRUuid");
    QRCode.src = QRJson["QrBase64"];
    uuid.value = QRJson["Uuid"];
    loadingTip.style.display = "none";
}

function CheckLogin(){
    const uuid = document.getElementById("QRUuid");
    if (!uuid.value){
        onError("请等待二维码加载完毕");
        return;
    }
    fetch(ApiCheckQR+uuid.value, {
        method: 'POST', // 可以是 GET、POST、PUT、DELETE 等
        headers: {
            'Content-Type': 'application/json' // 指定请求体为 JSON 格式
        }
    }).then(r => {
        if (!r.ok) {
            onError("检查登录状态失败,请确保您的网络连接和账号状态正常");
        }
        return r.json();
    }).then(data => {
        const acctSectResp = data["Data"]["acctSectResp"];
        window.wxid = acctSectResp["userName"];
        if (window.wxid === undefined){
            onError("检查登录状态失败,您在手机端确认登录了吗？"); // 捕获错误
            return;
        }

        window.location.href = "main.html?wxid="+window.wxid;
    }).catch(error => {
        onError("检查登录状态失败,您在手机端确认登录了吗？"); // 捕获错误
    });
}

function showInstruction(){
    layer.open({
        type: 1,
        area: [0.5*(window.screen.width)+'px', 0.5*(window.screen.height)+'px'], // 宽高
        title: '请仔细阅读用户须知',
        content: `<div style="padding: 11px;">
<p class="layui-font-20">1.本软件使用<strong class="layui-font-22">微信ipad协议</strong>来自动获取您的账号和好友等信息,因此扫码授权登录时会提示登录ipad微信,请放心使用</p>
<p class="layui-font-20">2.本软件完全<strong class="layui-font-22">开源免费</strong>,若您是购买的,请退款</p>
<p class="layui-font-20">3.本软件<strong class="layui-font-22">不存在盗号和上传隐私数据的行为</strong>(也没有能力这样做)。另外,您可以到github审阅软件的源代码或在f12中查看网络请求</p>
<p class="layui-font-20">若您还是不放心,请<strong class="layui-font-22">不要</strong>扫码授权登录</p>
<p class="layui-font-20">4.检测过程中请耐心等待,<strong class="layui-font-22">不要刷新页面或者离开页面(把当前标签页退到后台也不行)</strong>,否则可能检测失败</p>
<p class="layui-font-20">5.若微信官方更新协议版本,本软件可能不再能成功地获取微信协议的加密信息</p>
<p class="layui-font-20">6.阅读完毕后,<strong>点击右上角的关闭按钮来关闭对话框</strong>,同时页面底部的提示也要阅读</p>
<br>
<p>免责声明:</p>
<p>本软件(微信真实好友检测&WechatRealFriends)旨在帮助微信用户更好的使用微信,并非“圈钱”、“病毒”软件,软件不提供商业、广告、信息骚扰等破坏微信良好环境的功能</p>
<br>
<br>
<br>
<br>
<p>开发者: StrayMeteor3337 微信ipad849协议内核提供: 【盖世英雄】@cn_6688</p>
<p>鸣谢: ZogeMung,OutfitPure</p>
<p class="layui-font-16">感谢使用,感谢支持! 开源仓库地址:<a href="https://github.com/StrayMeteor3337/WechatRealFriends" target="_blank" style="color: #2d93ca">https://github.com/StrayMeteor3337/WechatRealFriends</a></p>
</div>`
    });
}

function showChangeLog(){
    // 弹出位置
    layer.open({
        type: 1,
        offset: ['1px', '1px'], // 详细可参考 offset 属性
        id: 'ID-wrf-layer-offset', // 防止重复弹出
        content: '<div style="padding: 16px;">'+ "修复了添加标签时的逻辑问题(感谢ZogeMung)" +'</div>',
        area: '240px',
        title: 'V1.0.4更新日志',
        btn: '关闭',
        btnAlign: 'c', // 按钮居中
        shade: 0, // 不显示遮罩
        yes: function(){
            layer.close(layer.index);
        }
    });
}

showInstruction();
showChangeLog();

fetch(ApiGetQR, {
    method: 'POST', // 可以是 GET、POST、PUT、DELETE 等
    headers: {
        'Content-Type': 'application/json' // 指定请求体为 JSON 格式
    },
    body: JSON.stringify(dataGetQR) // 将 JavaScript 对象转换为 JSON 字符串
}).then(r => {
    if (!r.ok) {
        onError("获取登录二维码失败");
    }
    return r.json();
}).then(data => {
    showQR(data["Data"]) // 输出转换后的 JavaScript 对象
}).catch(error => {
    onError("获取登录二维码失败  "+error.toString()); // 捕获错误
});

