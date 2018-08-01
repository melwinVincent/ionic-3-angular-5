export interface RequestHeaderInterface { 
    "RequestMode": string,
    "UserID": string,
    "UserType" : string,
    "BearerKey": string,
    "ServiceId": string,
    "SessionId": string,
    "Locale": string,
    "DeviceDet":DeviceDetailsInterface
}
interface DeviceDetailsInterface {
    "imei": string,
    "uuid": string,
    "deviceModel": string,
    "deviceManufacturer": string,
    "deviceOS": string,
    "deviceOSVersion": string,
    "serviceProvider": string,
    "ipAddress": string
}
