import { Component } from '@angular/core';
import { NavController, IonicPage, Events, ModalController, Modal, LoadingController, Loading, AlertController } from 'ionic-angular';
import { MyRequestService } from '../../services/my-request.service';
import { CacheMemoryService } from '../../services/cache.memory.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { MemoryService } from '../../services/memory.service';
import { CreateRequestService } from '../../services/create-request.service';

@IonicPage()
@Component({
  selector: 'page-my-requests',
  templateUrl: 'my-requests.html',
})
export class MyRequests {
  language : string;
  loading : Loading;
  detailsModal : Modal;
  items : Array<any> = [];

  constructor(
    private myRequestService : MyRequestService, 
    private events : Events,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private cacheMemoryService : CacheMemoryService,
    private translateService: TranslateService,
    private navCtrl : NavController,
    private alertCtrl: AlertController,
    private memoryService : MemoryService,
    private createRequestService : CreateRequestService) {
      this.language = this.cacheMemoryService.get("language");
      this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.language = this.translateService.currentLang;
      });

      events.subscribe('update:req', (data) => {
        if(data.isDelete) {
          this.deleteRequest(data.id);
        } else {
          this.editRequest(data.item, true);
        }

      });
    }
  // for toasting
  toast(msg:string) {
    this.events.publish('toast', msg);
  }

  presentLoading() {
      this.loading = this.loadingCtrl.create({
      content: 'Loading ...'
      });
      this.loading.present();
  }

  hideLoading() {
      if(this.loading) this.loading.dismiss()
  }
  
  presentDetailsModal(modal, data) {
    this.detailsModal = this.modalCtrl.create(modal, {data: data});
    this.detailsModal.onDidDismiss(res => {
      if(res) {
        // do your stuff
        if(res.isDelete) {
          this.deleteRequest(res.id);
        } else {
          this.editRequest(res.item, true);
        }
      }
    });
    this.detailsModal.present();
  }

  getCreatedRequests() {
    let postData = {
      "mast": { 
        "service_request_id": "ALL", 
        "status": "ALL"
      },
    }
    this.myRequestService.setPostData(postData).then(()=>{
        // the api is called only after the setPostData promise is resolved 
        this.myRequestService.customPsuedoSubscribe('getCreatedRequestsObservable').subscribe((data)=>{
          if(data[0].StatusCode === 0) {
            this.items = data[1];
            //console.log(this.items)
          } else {
            this.toast(data[0].StatusDesc);
          }
        
        },(data)=>{
          // remove the refernce string from memory
          this.toast("Couldn't connect");
        });
        
      },(error)=>{
        // this promise never gets rejected as per our framework
        this.toast(error);
        console.log("setPostData rejected", error);
      });
  }

  ionViewDidEnter() {
    this.getCreatedRequests();
  }

  getDetails = (id, isUpdate) => {
    return new Promise((resolveGetDetails, rejectGetDetails) => {
      this.details(id, isUpdate, resolveGetDetails);
    });
  }
  details(id, isUpdate, resolveGetDetails) {
    console.log("details : ",id);

    let postData = {
      "mast": { 
        "service_request_id": id, 
        "status": "ALL"
      },
    }
    this.myRequestService.setPostData(postData).then(()=>{
        // the api is called only after the setPostData promise is resolved 
        this.myRequestService.customPsuedoSubscribe('getRequestDetailsObservable').subscribe((data)=>{
          if(data[0].StatusCode === 0) {
            let modalData = {
              reqData : data[1],
              images : data[2]
            }
            if(isUpdate) {
               resolveGetDetails(modalData);
            } else {
              this.presentDetailsModal('Details', {data: modalData});
            }
            
          } else {
            this.toast(data[0].StatusDesc);
          }
        
        },(data)=>{
          // remove the refernce string from memory
          this.toast("Couldn't connect");
        });
        
      },(error)=>{
        // this promise never gets rejected as per our framework
        this.toast(error);
        console.log("setPostData rejected", error);
      });
  }

  deleteRequest(id) {
    console.log(id);
    let presentConfirm = ()=> {
      let alert = this.alertCtrl.create({
        title: 'Confirm',
        message: 'Do you want to delete this request !',
        buttons: [
          {
            text: 'NO',
            role: 'cancel',
            handler: () => {
              // do nothing
              console.log('Cancel clicked, user is ready to wait');
            }
          },
          {
            text: 'YES',
            handler: () => {
              this.deleteSubmit(id)
              console.log('Cancel clicked, user is ready to wait');
            }
          }
        ]
      });
      // present
      alert.present();
    }
    presentConfirm();
    
  }

  editRequest(item:any, isObj:boolean) {
    if(isObj) {
      console.log("obj : ", item);
      this.memoryService.updateLocalMemory('requestObj', item);
      this.navCtrl.parent.select(0);
      setTimeout(() => {
        this.events.publish('close:details-modal');
      }, 250);
    } else {
      console.log("id only", item);
      this.getDetails(item, true).then((data)=> {
        this.memoryService.updateLocalMemory('requestObj', data);
        this.navCtrl.parent.select(0);
      });
    }
  }

  // post api call
  deleteSubmit(serviceReqID) {

    let postObj = {
          // DELETE for creating a request
          mode: 'DELETE',
          mast: { 
            service_request_id: serviceReqID
          }
    }
    this.createRequestService.setPostData(postObj).then(()=>{
      // the api is called only after the setPostData promise is resolved 
      this.createRequestService.customPsuedoSubscribe('createRequestObservable').subscribe((data)=>{

        if(data[0].StatusCode === 0) {
          this.toast(data[0].Message);
          setTimeout(() => {
            let index = this.items.indexOf(this.items.filter(obj => {return obj.service_request_id === serviceReqID})[0]);
            console.log(index);
            this.items.splice(index,1);
            this.events.publish('close:details-modal');
          }, 250); // for better UX
        } else {
          this.toast(data[0].StatusDesc);
        }
      
      },(data)=>{
        // remove the refernce string from memory
        this.toast("Couldn't connect");
      });
      
    },(error)=>{
      // this promise never gets rejected as per our framework
      this.toast(error);
      console.log("setPostData rejected", error);
    });

  }

}
