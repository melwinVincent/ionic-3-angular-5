import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { LoadingController, Loading } from 'ionic-angular';
import { MemoryService } from './memory.service';
import { APP_CONFIG } from '../app/app.config';
import { RequestHeaderService } from './request.header.service';
@Injectable()
export class CreateRequestService {
    // for displaying the loader animation
    loading : Loading;
    // if there is any GET api in the service, we push the observer 'string' to this array (as per our framework)
    activeObservers : Array<string> = [];
    // POST api's should have a data Object (as per our framework)
    postData: any;
    // if there is any POST api in the service, then we need a HttpHeaders (Angular 5) instance (as per our framework)
    headersInstance: HttpHeaders;
    
    // Observable for getting service types 
    getServicesObservable : Observable<any>

    // Observable for getting time blocks
    getTimeblocksObservable : Observable<any>

    // Observable for posting a request
    createRequestObservable : Observable<any>

    constructor(
         private http: HttpClient, 
         private loadingCtrl: LoadingController, 
         private memoryService : MemoryService,
         private requestHeaderService : RequestHeaderService
         ){
        // initialize headersInstance
        this.headersInstance = new HttpHeaders().set('Content-Type', 'application/json')
        
        // observable for POST api
        this.getServicesObservable = Observable.create(observer => {
            /*
                before calling the POST api, push the refernce string to memory.
                refer the updatePostObservers method in MemoryService 
                refer registerBackButtonAction in app.component.ts
            */
            this.presentLoading();
            this.memoryService.updatePostObservers('getServicesObservable', true);
            // before calling the POST api, this.postData is set by calling the setPostData method of this same service from the component
            this.http.post(APP_CONFIG.baseUrl+'User/GetServiceList', this.postData, {headers: this.headersInstance}).subscribe(data => {
                // to remove the refernce string from memory
                this.memoryService.updatePostObservers('getServicesObservable', false);
                this.loading.dismiss();
                // call next method and pass data to the component
                //console.log(data);
                observer.next(data);
                observer.complete();
            }, ()=>{
                // remove the refernce string from memory
                this.memoryService.updatePostObservers('getServicesObservable', false);
                this.loading.dismiss();
                console.log("error");
                observer.error(false);
            });
        });

        // observable for POST api
        this.getTimeblocksObservable = Observable.create(observer => {
            /*
                before calling the POST api, push the refernce string to memory.
                refer the updatePostObservers method in MemoryService 
                refer registerBackButtonAction in app.component.ts
            */
            // This api is called along with the above api,  can't include two loaders
            //this.presentLoading();
            this.memoryService.updatePostObservers('getTimeblocksObservable', true);
            // before calling the POST api, this.postData is set by calling the setPostData method of this same service from the component
            this.http.post(APP_CONFIG.baseUrl+'User/GetTimeMode', this.postData, {headers: this.headersInstance}).subscribe(data => {
                // to remove the refernce string from memory
                this.memoryService.updatePostObservers('getTimeblocksObservable', false);
                //this.loading.dismiss();
                // call next method and pass data to the component
                observer.next(data);
                observer.complete();
            }, ()=>{
                // remove the refernce string from memory
                this.memoryService.updatePostObservers('getTimeblocksObservable', false);
                //this.loading.dismiss();
                console.log("error");
                observer.error(false);
            });
        });

        // observable for POST api
        this.createRequestObservable = Observable.create(observer => {
            /*
                before calling the POST api, push the refernce string to memory.
                refer the updatePostObservers method in MemoryService 
                refer registerBackButtonAction in app.component.ts
            */
            this.presentLoading();
            this.memoryService.updatePostObservers('createRequestObservable', true);
            // before calling the POST api, this.postData is set by calling the setPostData method of this same service from the component
            this.http.post(APP_CONFIG.baseUrl+'User/UpdateServiceReQuest', this.postData, {headers: this.headersInstance}).subscribe(data => {
                // to remove the refernce string from memory
                this.memoryService.updatePostObservers('createRequestObservable', false);
                this.loading.dismiss();
                // call next method and pass data to the component
                observer.next(data);
                observer.complete();
            }, ()=>{
                // remove the refernce string from memory
                this.memoryService.updatePostObservers('createRequestObservable', false);
                this.loading.dismiss();
                console.log("error");
                observer.error(false);
            });
        });

    }

    /******** general methods for the services *********/
    
    // this method is used to sunscribe the Observables in this service from the respective component 
    customPsuedoSubscribe(observableInstance) {
        return this[observableInstance];
    }
    // return the array of active GET Observers
    getObservers() {
        return this.activeObservers;
    }
    // removes the active GET Observer
    removeObserver(observerName) {
        this.activeObservers.splice(this.activeObservers.indexOf(observerName),1);
    }
    // to cancel the GET Obeserver
    cancel(observerName) {
        this.loading.dismiss();
        this.removeObserver(observerName);
        // mark it as complete
        this[observerName].complete();
    }
    // called form the respective component 
    setPostData(postObj) {
        // the method returns a promise.
        // resolved when the addRequestHeaders() gets resolved
        return new Promise((resolve, reject) => {
            // another promise
            this.requestHeaderService.addRequestHeaders(postObj).then((data)=>{
                //console.log("resolved postObj is  : ",data);
                // before resolving, set the postData to the service for api call
                this.postData = JSON.stringify(data);
                resolve();
            },(err)=>{
                // this promise never gets rejected as per our framework
                reject(err);
            })

        });

    }

    // used for loader
    presentLoading() {
        this.loading = this.loadingCtrl.create({
        content: 'Loading ...'
        });
        this.loading.present();
    }

    hideLoading() {
        this.loading.dismiss()
    }
}