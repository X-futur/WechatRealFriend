const url = "//127.0.0.1:81/api";

const ApiGetQR = url + "/Login/GetQR";
const dataGetQR = {
    DeviceID: "",
    DeviceName: "",
    Proxy: {
        ProxyIp: "",
        ProxyPassword: "",
        ProxyUser: ""
    }
};

const ApiCheckQR = url + "/Login/CheckQR?uuid=";

const ApiGetProfile = url + "/User/GetContractProfile?wxid=";

const ApiGetContractList = url + "/Friend/GetContractList";
const dataGetContractList = {
    "CurrentChatRoomContactSeq": 0,
    "CurrentWxcontactSeq": 0,
    "Wxid": "string"//替换为对应微信号
};

const ApiGetRelation = url + "/Friend/GetFriendRelation";
const dataGetRelation = {
    "UserName": "string",//替换为要检测与其关系的好友的微信号
    "Wxid": "string"//替换为对应微信号
};

const ApiGetContractDetail = url + "/Friend/GetContractDetail";
const dataGetContractDetail = {
    "ChatRoom": "string",//留空
    "Towxids": "string",//替换为要检测与其关系的好友的微信号
    "Wxid": "string"//替换为对应微信号
};

const ApiAddLabel = url + "/Label/Add";
const dataAddLabel = {
    "LabelName": "string",
    "Wxid": "string"
};

const ApiUpdateLabel = url + "/Label/UpdateList";
const dataUpdateLabel = {
    "LabelID": "string",
    "ToWxids": "string",
    "Wxid": "string"
};