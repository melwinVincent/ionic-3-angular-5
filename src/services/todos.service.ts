import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { LoadingController, Loading } from 'ionic-angular';
import { MemoryService } from './memory.service';
import { APP_CONFIG } from '../app/app.config';
@Injectable()
export class TodosService {
    // for displaying the loader animation
    loading : Loading;
    // if there is any GET api in the service, we push the observer 'string' to this array (as per our framework)
    activeObservers : Array<string> = [];
    // POST api's should have a data Object (as per our framework)
    postData: any;
    // if there is any POST api in the service, then we need a HttpHeaders (Angular 5) instance (as per our framework)
    headersInstance: HttpHeaders;
    
    /****** all the api's have an Observable object (as per our framework) ******/

    // observable for get API to fetch the todos data
    todosObservable : Observable<any>;
    /*
        we associate an observer (of type any) for each GET api (as per our framework).
        this is used for cancelling the get api's data binding (refer the cancel function in the service)
        PS : we are not using this cancelling functionality for the time being
    */
    todosObserver : any;
    // Observable for posting a todo object
    postTodoObservable : Observable<any>
    // Observable for deleting a todo object
    deleteTodoObservable : Observable<any>

    constructor(
         private http: HttpClient, 
         private loadingCtrl: LoadingController, 
         private memoryService : MemoryService){
        // initialize headersInstance
        this.headersInstance = new HttpHeaders().set('Content-Type', 'application/json')
        
        // observable for GET api
        // this api returns todos objects
        this.todosObservable = Observable.create(observer => {
            this.presentLoading();
            this.todosObserver = observer;
            this.activeObservers.push('todosObserver');
            // actually this api returns todos objects with username 'test', that's how it is coded in nodejs
            // subscribe to this http.get() to get the data and pass the data to the component
            this.http.get(APP_CONFIG.baseUrl+'todos/test').subscribe(data => {
                    // on success we remove the respective observer reference from the activeObservers array
                    this.removeObserver('todosObserver');
                    this.loading.dismiss();
                    // call the next method pass data to the component
                    observer.next(data);
            }, ()=>{
                // on error we remove the respective observer reference from the activeObservers array
                this.removeObserver('todosObserver');
                this.loading.dismiss();
                console.log("error");
            })
        });
        // observable for POST api
        this.postTodoObservable = Observable.create(observer => {
            this.presentLoading();
            /*
                before calling the POST api, push the refernce string to memory.
                refer the updatePostObservers method in MemoryService 
                refer registerBackButtonAction in app.component.ts
            */
            this.memoryService.updatePostObservers('postTodoObservable', true);
            // before calling the POST api, this.postData is set by calling the setPostData method of this same service from the component
            this.http.post(APP_CONFIG.baseUrl+'todo', this.postData, {headers: this.headersInstance}).subscribe(data => {
                // to remove the refernce string from memory
                this.memoryService.updatePostObservers('postTodoObservable', false);
                this.loading.dismiss();
                // call next method and pass data to the component
                observer.next(data);
            }, ()=>{
                // remove the refernce string from memory
                this.memoryService.updatePostObservers('postTodoObservable', false);
                this.loading.dismiss();
                console.log("error");
            })
        });

        // observable for DELETE api
        this.deleteTodoObservable = Observable.create(observer => {
            this.presentLoading();
            /*
                before calling the POST api, push the refernce string to memory.
                refer the updatePostObservers method in MemoryService 
                refer registerBackButtonAction in app.component.ts
            */
            this.memoryService.updatePostObservers('deleteTodoObservable', true);
            this.http.post(APP_CONFIG.baseUrl+'todoDelete', this.postData, {headers: this.headersInstance}).subscribe(data => {
                // to remove the refernce string from memory
                this.memoryService.updatePostObservers('deleteTodoObservable', false);
                this.loading.dismiss();
                // call next method and pass data to the component
                observer.next(data);
            }, ()=>{
                // remove the refernce string from memory
                this.memoryService.updatePostObservers('deleteTodoObservable', false);
                this.loading.dismiss();
                console.log("error");
            })
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
    setPostData(postData) {
        this.postData = postData;
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