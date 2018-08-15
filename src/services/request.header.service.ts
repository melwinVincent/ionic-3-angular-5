import {Injectable} from '@angular/core';
import { RequestHeaderInterface } from '../interfaces/request-header.interface';
import { CacheMemoryService } from './cache.memory.service';
import { Platform } from 'ionic-angular';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
@Injectable()
export class RequestHeaderService {

    requestHeader : RequestHeaderInterface;
    pluginTimeout : 10000;
    uuid : string = "";
    constructor(private cacheMemoryService : CacheMemoryService, private platform: Platform, private uniqueDeviceID: UniqueDeviceID) {
        // constructor
        if(window["cordova"] && window["plugins"].uniqueDeviceID) {
            this.uniqueDeviceID.get()
            .then((uuid: any) => {
                this.uuid = uuid;
            })
            .catch((error: any) => console.log(error));
        }
        
    }
    // this method is called from setReqData method and the parameters are passed to this function from the setReqData funtion.
    // setReqData returns a promise, and the parameters passed to the below method are the resolve and reject references of that Promise
    setData = (resolveSetReqDataParam,rejectSetReqDataParam) => {
        // this method returns a promise and is resolved when the plugin fetch sim info
        // called below
        let setSIMData = () => {
            return new Promise((resolve, reject) => {
                window['plugins'].sim.getSimInfo((respose) => {
                    console.log("respose : ",respose);
                    // set the serviceProvider, in iOS it will be a single string, in android it might be a comma separated string (for dual sims)
                    if(this.platform.is('ios') || this.platform.is('ipad') || this.platform.is('iphone')) {
                        this.requestHeader.DeviceDet.serviceProvider = respose.carrierName ? respose.carrierName : "";
                    } else {
                        let card : string;
                        if(respose.cards && respose.cards.length) {
                            card = respose.cards.length > 1 ? respose.cards[0].carrierName + "," + respose.cards[1].carrierName : respose.cards[0].carrierName; 
                        }
                        this.requestHeader.DeviceDet.serviceProvider = card ? card : "";
                    }
                    this.requestHeader.DeviceDet.imei = respose.deviceId ? respose.deviceId : "";
                    // after setting the object, reslove this promise
                    resolve();
                },(error) => {
                    reject(error);
                });
            });
        }

        // another promise
        // called below
        let setIPData = () => {
            return new Promise((resolve, reject) => {
                window['networkinterface'].getWiFiIPAddress((ip) => { 
                    console.log("ip and subnet", ip); 
                    this.requestHeader.DeviceDet.ipAddress = ip ? ip : "";
                    // after setting the object, reslove this promise
                    resolve();
                }, function(err) { 
                    reject(err); 
                });
            });
        }

        // Promise chaining :

        /************ approach - 1 ************/
        
        /* 
            // code is moving towards right in this approach, this is not the right way of coding, we need our code to flow downwards
            setSIMData().then(()=>{
                setIPData().then(()=>{
                    resolveSetReqDataParam();
                }, (err)=>{
                    rejectSetReqDataParam();
                });
            },(err) =>{
                rejectSetReqDataParam(err)
            });

        */
        
        /************ approach - 2 (standard)************/
        
        /*
            Simplifying the above stack
            This kind of stacking should be selected when we need both the promise to be resolved to move forward.
            Or when the data resolved from one promise need to be passed to the next promise.
            No need to handle error for each pormise , this kind of stack catches error when any of the promise in the stack gets rejected
        */
        
        /*
        
        // in this approach, we call the setSIMData method first and once the returned promise gets resolved, we return the returned promise from setIPData method and the stack continues
        setSIMData()
        .then(()=>{
            // make the callback itself to return the new promise, so we can stack the code as shown below
            return setIPData() // we call the method, it returns a promise, so we can call .then() on setSIMData().then()
        })
        .then((ip)=>{
            console.log("the resolved data is : ", ip);
            // setReqData Promise is resolved in the stack
            resolveSetReqDataParam();
        })
        .catch((err)=>{
            // if any of the promise in the stack gets rejected, the rejected data gets catched here and we can do our stuff
            // here we reject setReqData Promise if any of the plugin throws error
            rejectSetReqDataParam(err);
        });

        */
        
        /************ approach - 3 ************/
        /*
            Instead of stacking, we can make them independent. We don't reject the parent promise (setReqData) here.
            If the plugin fails to fetch the required details, we resolve without setting anything. 
            We don't want to reject the promise due plugin failure.
        */

        /*
            Here we call the methods independently. We may not know which of them gets resolved first.
            So. in the then() of one method check if the other method is resolved and the data is set.
            If the data is set, the resolve the setReqData Promise by calling the passed resolve reference
        */

        // to fetch SIM details
        setSIMData().then(()=>{
            if(this.requestHeader.DeviceDet.ipAddress) resolveSetReqDataParam();
        }, (err) => {
            // we don't reject the setReqData Promise in our framework
            console.log(err);
            /*
                If the setSIMData plugin rejects, then immediately resolve the setReqData promise only if the other setIPData plugin promise has resolved. 
                If not wait for 10 seconds to resolve.
           */ 
            if(this.requestHeader.DeviceDet.ipAddress) {
                resolveSetReqDataParam();
            } else {
                setTimeout(() => {
                    /* 
                        Once the control reach here, the other plugin might have resolved. 
                        But we don't take that into account, we resolve the setReqData anyway after 10s.
                    */
                    resolveSetReqDataParam();
                }, this.pluginTimeout);
            }
        });

        // to fetch IP details
        setIPData().then(()=>{
            if(this.requestHeader.DeviceDet.serviceProvider) resolveSetReqDataParam();
        }, (err) => {
            // we don't reject the setReqData Promise in our framework
            console.log(err);
            /*
                if the setIPData plugin rejects, then immediately resolve the setReqData promise only if the other setSIMData plugin promise has resolved.
                If not wait for 10 seconds to resolve.
             */
             if(this.requestHeader.DeviceDet.serviceProvider) {
                resolveSetReqDataParam();
            } else {
                setTimeout(() => {
                    /* 
                        Once the control reach here, the other plugin might have resolved. 
                        But we don't take that into account, we resolve the setReqData anyway after 10s.
                    */
                    resolveSetReqDataParam();
                }, this.pluginTimeout);
            }
        });

    }

    setReqData() {
        // returns a promise
        return new Promise((resolveReqData, rejectReqData) => {
            // userData object is set
            let loginData = this.cacheMemoryService.getJSON("loginResponse");
            let sessionID = this.cacheMemoryService.get("sessionID");
            // requestHeader object is set
            this.requestHeader = {
                "RequestMode" : "0", //hardcoded to 0 for mobile
                "UserID": loginData.userid ? loginData.userid : "",
                "BearerKey": "",
                "ServiceId": "",
                "SessionId": sessionID ? sessionID : "",
                "UserType": loginData.usertype ? loginData.usertype : "",
                "Locale": "E", //hardcoded
                "DeviceDet" : {
                    "uuid" : this.uuid ?  this.uuid : "xyz789", // for some api calls, uuid is mandatory, so pass a dummy value for development purpose
                    "deviceModel" : window['device'] ? window["device"].model : "",
                    "deviceManufacturer" : window['device'] ? window["device"].manufacturer : "",
                    "deviceOS" : window['device'] ? window["device"].platform : "",
                    "deviceOSVersion" : window['device'] ? window["device"].version : "",
                    "imei" : "",
                    "serviceProvider" : "",
                    "ipAddress" : ""
                }
            }

            // this is a callback method, this method is called below
            let checkPermissionCallback = (status) => {
                // called when READ_PHONE_STATE permission is granted
                if (!status.hasPermission) {
                    var errorCallback = function () {
                        console.warn('permission is not turned on');
                        this.toast('Permission is not turned on');
                    }
                    
                    permissions.requestPermission(permissions.READ_PHONE_STATE,function (status) {
                        if (!status.hasPermission) {
                            errorCallback();
                        } else {
                            // passing the resolveReqData and rejectReqData of this promise
                            this.setData(resolveReqData,rejectReqData);
                        }
                    },errorCallback);

                } else {
                    // passing the resolveReqData and rejectReqData of this promise
                    this.setData(resolveReqData,rejectReqData);
                }
            }

            if(window["cordova"]) {

                if(this.platform.is('ios') || this.platform.is('ipad') || this.platform.is('iphone')) {
                    // passing the resolveReqData and rejectReqData of this promise
                    this.setData(resolveReqData,rejectReqData);
                } else {
                    var permissions = window['cordova'].plugins.permissions;
                    // check permissons
                    permissions.checkPermission(permissions.READ_PHONE_STATE, checkPermissionCallback, null);
                }

            } else {
                // for development we simply resolve the promise and the requestHeader object is all set (blank) for development 
                resolveReqData();
            }
        });
    } 
    
    addRequestHeaders (postObj) {
        // resolved with the postObj when setReqData is resolved
        return new Promise((resolve, reject) => {
            // this method returns another promise
            this.setReqData().then(()=>{
                //console.log("requestHeader : ",this.requestHeader);
                postObj.ReqHead = this.requestHeader;
                resolve(postObj);
            },(err)=>{
                //we don't reject the setReqData Promise in our framework, so the below method call is irrelevant
                reject(err);
            });
            
        });
    }
}