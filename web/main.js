//WechatRealFriends By StrayMeteor3337,ZogeMung
// 错误提示函数
function onError(msg) {
    layer.msg(msg, { icon: 2 }, function () {
    });
}

// 获取 URL 参数
function getUrlParams(url) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const params = {};
    for (let param of urlParams.entries()) {
        params[param[0]] = param[1];
    }
    return params;
}

// 获取用户信息
async function getProfile(wxid) {
    try {
        document.getElementById("loadingTip").innerText = "正在获取账号信息...";
        const response = await fetch(ApiGetProfile + wxid, {
            method: 'POST',
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("获取账号信息失败，请检查网络连接");
        }

        const data = await response.json();
        const userInfo = data["Data"]["userInfo"];
        document.getElementById("wxid").innerText = wxid;
        document.getElementById("nickName").innerText = userInfo["NickName"]["string"];
        document.getElementById("signature").innerText = userInfo["Signature"];
        document.getElementById("headImg").src = data["Data"]["userInfoExt"]["SmallHeadImgUrl"];
    } catch (error) {
        console.error(error);
        onError("获取账号信息失败：" + error.message);
    }
}

// 获取好友列表
async function GetContractList(wxid, seq = 0) {
    try {
        document.getElementById("loadingTip").innerText = "正在获取好友列表，请稍候...";
        window.friends = []; // 初始化好友列表

        let continueFetching = true;
        while (continueFetching) {
            dataGetContractList.Wxid = wxid;
            dataGetContractList.CurrentWxcontactSeq = seq;

            const response = await fetch(ApiGetContractList, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataGetContractList)
            });

            if (!response.ok) {
                throw new Error("获取好友列表失败，请检查网络连接");
            }

            //Thanks for ZogeMung@github
            const notFriends = ["gh_", "@chatroom", "weixin", "filehelper", "qqmail", "weibo", "floatbottle", "medianote", "message"];
            const data = await response.json();
            const contractList = data["Data"]["ContactUsernameList"].filter(item => notFriends.every(notFriend => !item.includes(notFriend)));

            // 更新好友列表和 UI
            window.friends = window.friends.concat(contractList);
            document.getElementById("numOfFriends").innerText = window.friends.length.toString();

            // 检查是否需要继续获取
            if (data["Data"]["CountinueFlag"] === 1 && window.lastSeq !== seq) {
                window.lastSeq = seq;
                seq = data["Data"]["CurrentWxcontactSeq"]; // 更新序列号
            } else {
                continueFetching = false; // 停止循环
            }
        }

        document.getElementById("loadingTip").innerText = "获取好友列表成功";
    } catch (error) {
        console.error(error);
        onError("获取好友列表失败：" + error.message);
    }
}

// 查询好友关系
async function checkRelation(wxid) {
    document.getElementById("numOfDeleteYou").innerText = 0;
    document.getElementById("numOfBlackListYou").innerText = 0;
    document.getElementById("numOfBlackListedByYou").innerText = 0;
    try {
        document.getElementById("loadingTip2").innerText = "正在查询好友关系(这可能需要一会)...";
        window.deleteYou = [];
        window.blackListYou = [];
        window.blackListedByYou = [];
        let progress = 0;//初始化检测进度
        const maxProgress = window.friends.length;

        // 创建一个 Promise 数组来存储所有的 fetch 请求
        const fetchPromises = [];
        for (let userName of window.friends) { // 遍历好友列表
            dataGetRelation.Wxid = wxid;
            dataGetRelation.UserName = userName;

            const fetchPromise = fetch(ApiGetRelation, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataGetRelation)
            })
                .then(r => {
                    if (!r.ok) {
                        throw new Error("查询好友关系失败，请检查网络连接");
                    }
                    return r.json();
                })
                .then(data => {
                    const relation = data["Data"]["FriendRelation"];
                    switch (relation) {
                        case 1: // 被删除
                            getOriginalLabelId(wxid, userName).then(labelID => {
                                const userDeleted = {
                                    userName: userName,
                                    originalLabelId: labelID
                                }
                                window.deleteYou.push(userDeleted);
                                document.getElementById("numOfDeleteYou").innerText = window.deleteYou.length.toString();
                            });
                            break;
                        case 4: // 被我拉黑的
                            window.blackListedByYou.push(userName);
                            document.getElementById("numOfBlackListedByYou").innerText = window.blackListedByYou.length.toString();
                            break;
                        case 5: // 拉黑我的
                            getOriginalLabelId(wxid, userName).then(labelID => {
                                const userBlackListYou = {
                                    userName: userName,
                                    originalLabelId: labelID
                                }
                                window.blackListYou.push(userBlackListYou);
                                document.getElementById("numOfBlackListYou").innerText = window.blackListYou.length.toString();
                            });
                            break;
                    }
                    progress++;
                    layui.element.progress("checkRelation-progress-bar",
                        progress.toString() + "/" + maxProgress.toString()
                    );
                })
                .catch(error => {
                    console.error(`查询好友 ${userName} 关系失败：`, error);
                    onError(`查询好友 ${userName} 关系失败：`);
                });

            fetchPromises.push(fetchPromise);

            // 限制并发请求数量（例如每次最多 10 个）
            if (fetchPromises.length >= 10) {
                await Promise.all(fetchPromises);
                fetchPromises.length = 0; // 清空已完成的请求
            }
        }

        // 等待剩余的请求完成
        await Promise.all(fetchPromises);

        // 所有请求完成后更新提示信息
        document.getElementById("loadingTip2").innerText = "查询好友关系完成，下面是最终结果";
    } catch (error) {
        console.error(error);
        onError("查询好友关系失败：" + error.message);
    }
}

// 获取好友标签列表
async function getOriginalLabelId(wxid, towxids, chatroom = "") {
    dataGetContractDetail.Wxid = wxid;
    dataGetContractDetail.ToWxids = towxids;
    dataGetContractDetail.Chatroom = chatroom;

    const response = await fetch(ApiGetContractDetail, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataGetContractDetail)
    })
    if (!response.ok) {
        onError("获取好友标签失败，请检查网络连接");
    }
    try {
        const responseData = await response.json();
        return responseData["Data"]["ContactList"][0]["LabelIdlist"];
    } catch (error) {
        onError("获取好友标签失败，请重试" + error.toString());
    }
}


async function AddLabelDeleted(wxid) {
    dataAddLabel.LabelName = "#删除我的人";
    dataAddLabel.Wxid = wxid;
    const response = await fetch(ApiAddLabel, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataAddLabel)
    });
    if (!response.ok) {
        onError("添加标签时失败,请重试(但不要刷新页面)");
    }
    try {
        const responseData = await response.json();
        return responseData["Data"]["LabelPairList"]["labelID"];
    } catch (error) {
        onError("添加标签时失败,请重试(但不要刷新页面): " + error.toString());
    }
}

async function AddLabelBlackListed(wxid) {
    dataAddLabel.LabelName = "#拉黑我的人";
    dataAddLabel.Wxid = wxid;
    const response = await fetch(ApiAddLabel, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataAddLabel)
    });
    if (!response.ok) {
        onError("添加标签时失败,请重试(但不要刷新页面)");
    }
    try {
        const responseData = await response.json();
        return responseData["Data"]["LabelPairList"]["labelID"];
    } catch (error) {
        onError("添加标签时失败,请重试(但不要刷新页面): " + error.toString());
    }
}

async function setLabelForAbnormalFriends(wxid, LabelID1, LabelID2) {
    //所有标号为1的变量均为添加联系人到 #删除我的人
    //所有标号为2的变量均为添加联系人到 #拉黑我的人
    const dataUpdateLabel1 = Object.assign({}, dataUpdateLabel);
    const dataUpdateLabel2 = Object.assign({}, dataUpdateLabel);

    for (let deleteYou of window.deleteYou) {
        const newLabelID = [deleteYou.originalLabelId, LabelID1];
        dataUpdateLabel1.LabelID = newLabelID.filter(item => item !== null && item !== undefined).join(",").toString();
        dataUpdateLabel1.Wxid = wxid;
        dataUpdateLabel1.ToWxids = deleteYou.userName;
        const response1 = await fetch(ApiUpdateLabel, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataUpdateLabel1)
        });
        if (!response1.ok) {
            onError("向标签中添加异常好友时失败,请重试(但不要刷新页面)");
        }
    }

    for (let blackListYou of window.blackListYou) {
        const newLabelID = [blackListYou.originalLabelId, LabelID2];
        dataUpdateLabel2.LabelID = newLabelID.filter(item => item !== null && item !== undefined).join(",").toString();
        dataUpdateLabel2.Wxid = wxid;
        dataUpdateLabel2.ToWxids = blackListYou.userName;
        const response2 = await fetch(ApiUpdateLabel, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataUpdateLabel2)
        });
        if (!response2.ok) {
            onError("向标签中添加异常好友时失败,请重试(但不要刷新页面)");
        }
    }
}

async function setLabelConfirm(wxid) {
    layer.confirm('请确保原本标签中没有与上述标签重名的标签,否则将导致未知异常', {
        btnAsync: true,//启用异步按钮
        btn: ['确认添加标签', '取消'] //按钮
    }, async function (index, layero, that) {
        var defer = layui.$.Deferred();
        that.loading(true);
        const LabelIDDeleted = await AddLabelDeleted(wxid);// 创建标签“#删除我的人”
        const LabelIDBlackListed = await AddLabelBlackListed(wxid);// 创建标签“#拉黑我的人”
        setLabelForAbnormalFriends(wxid, LabelIDDeleted, LabelIDBlackListed).then(
            defer.resolve
        );
        layer.open({
            type: 1,
            area: [0.75 * (window.screen.width) + 'px', 0.8 * (window.screen.height) + 'px'], // 宽高
            content: `<div style="padding: 11px;">
<p class="layui-font-20">大功告成! 您现在可以在微信电脑版客户端中一键删除异常好友</p>
<p class="layui-font-20">记得在手机端退出登录"ipad微信"哦</p>
<img src="assets/howToDelete.jpg" class="layui-padding-2" style="max-width: 800px;">
<p>觉得好的话,可以到github星标该仓库</p>
<p class="layui-font-16">感谢使用,感谢支持! 开源仓库地址:<a href="https://github.com/StrayMeteor3337/WechatRealFriends" target="_blank" style="color: #2d93ca">https://github.com/StrayMeteor3337/WechatRealFriends</a></p>
</div>`
        });
        return defer.promise();
    });
}

// 主流程
(async function main() {
    try {
        // 获取 URL 参数中的 wxid
        const wxid = getUrlParams(window.location.href)["wxid"];
        if (!wxid) {
            throw new Error("未找到 wxid 参数");
        }

        // 初始化全局变量
        window.friends = [];
        window.wxid = wxid;

        // 按顺序执行操作
        await getProfile(wxid); // 获取用户信息
        await GetContractList(wxid); // 获取好友列表
        await checkRelation(wxid); // 查询好友关系
        document.getElementById("finish-panel").style.display = "inline-block"
    } catch (error) {
        console.error(error);
        onError("初始化失败：" + error.message);
    }
})();