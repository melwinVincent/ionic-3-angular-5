import { Component } from '@angular/core';
import { IonicPage, Events, ModalController, Modal, AlertController, ActionSheetController, LoadingController, Loading } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateRequestService } from '../../services/create-request.service';
import { MemoryService } from '../../services/memory.service';
import { CacheMemoryService } from '../../services/cache.memory.service';
import { DatePicker } from '@ionic-native/date-picker';
import { APP_CONFIG } from '../../app/app.config';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Geolocation } from '@ionic-native/geolocation';

@IonicPage()
@Component({
  selector: 'page-create-request',
  templateUrl: 'create-request.html',
})

export class CreateRequest {
  // for displaying the loader animation
  loading : Loading;
  serviceListModal : Modal;
  createReqObj : CreateReqObj;
  requestFormGroup: FormGroup;
  timeBlocks : any = [];
  selectedMap : string = "CURRENT";
  options : CameraOptions = {
    quality: 75,
    destinationType: this.camera.DestinationType.DATA_URL,
    sourceType: this.camera.PictureSourceType.CAMERA,
    mediaType: this.camera.MediaType.PICTURE,
    allowEdit: false,
    encodingType: this.camera.EncodingType.JPEG,
    saveToPhotoAlbum: false,
    correctOrientation : true
  }

  constructor(
      private events : Events, 
      private modalCtrl: ModalController,
      private createRequestService : CreateRequestService,
      private memoryService : MemoryService,
      private formBuilder: FormBuilder,
      private cacheMemoryService : CacheMemoryService,
      private datePicker: DatePicker,
      private alertCtrl : AlertController,
      private translateService : TranslateService,
      private camera : Camera,
      private actionSheetController : ActionSheetController,
      private loadingCtrl: LoadingController,
      public geolocation: Geolocation
    ) {

    }

    presentImgActionSheet() {

      if(this.createReqObj.image.length > APP_CONFIG.maxReqImage) {
          this.toast("You can't add more than 4 images");
      } else {
          const actionSheet = this.actionSheetController.create({
            title: 'Choose from below options',
            buttons: [
              {
                text: 'Take live Image',
                handler: () => {
                  this.takePicture();
                }
              },{
                text: 'Choose from Gallery',
                handler: () => {
                  this.choosePicture()
                }
              },{
                text: 'Cancel',
                role: 'cancel',
                handler: () => {
                  console.log('Cancel clicked');
                }
              }
            ]
          });
          actionSheet.present();
      }

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

    ionViewDidLeave() {
      console.log("leaving");
      this.hideLoading();
    }

    viewLocation(){
      if (this.selectedMap === "CURRENT") {
        this.presentServiceListModal('MapModal', {isDraggable:false});
      } else if (this.selectedMap === "BASE") {
        this.presentServiceListModal('MapModal', {isDraggable:false, isBASE:true});
      } else {
        this.presentServiceListModal('MapModal', {isDraggable:true});
      }

    }

    showImages() {
      console.log("show images");
      //this.presentLoading();
      this.presentServiceListModal('ImageModal', this.createReqObj.image);
    }
    
    pushImg(imageData) {
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.createReqObj.image.unshift(base64Image);
      //this.showImages();
    }

    takePicture() {

      this.options.sourceType = this.camera.PictureSourceType.CAMERA;

      this.camera.getPicture(this.options).then((imageData) => {
          this.pushImg(imageData)
      }, (err) => {
        this.toast('Something went wrong');
      });
      
    }

    choosePicture() {

      this.options.sourceType = this.camera.PictureSourceType.PHOTOLIBRARY;

      this.camera.getPicture(this.options).then((imageData) => {
        this.pushImg(imageData)
      }, (err) => {
          this.toast('Something went wrong');
      });

    }


    openMap(val) {
      this.selectedMap = val;
      if(val === "MAP"){
        this.presentServiceListModal('MapModal', {isDraggable:true});
      }
    }

    setReqObj() {
      
      //this.selectedMap = "CURRENT";
      
      let today :any = new Date();
      today = today.getDate()+"/"+(today.getMonth()+1)+"/"+today.getFullYear();
      this.createReqObj = {
        service_id : "",
        service_name : "",
        description : "",
        latitude : "",
        longitude : "",
        contact_name: this.cacheMemoryService.getJSON('loginResponse').username , 
        contact_number: this.cacheMemoryService.getJSON('loginResponse').userPhone,
        required_date : today,
        time_mode : "",
        time_mode_display : "",
        image : [] //APP_CONFIG.imageArr // for testing
      }

      this.getTimeBlocks();
    }

    resetMemory() {
      this.memoryService.updateLocalMemory('parentItemID', "");
      this.memoryService.updateLocalMemory('selectedItemID', "");
      this.memoryService.updateLocalMemory('selectedItem', "");
      this.memoryService.updateLocalMemory('latLng', {});
    }

    ngOnInit() {
      this.setReqObj();
      // for validation
      this.requestFormGroup = this.formBuilder.group(
        {
          service : ['', Validators.compose([
            Validators.required])],
          description: ['', Validators.compose([
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(200)
            ])]
        }
      );
    }
  

    ionViewDidEnter() {
      if(!this.createReqObj.service_id) this.getServiceTypes();
      this.getTimeBlocks();
    }

    // for toasting
    toast(msg:string) {
      this.events.publish('toast', msg);
    }

    getServiceTypes() {
      if (this.memoryService.getData()['servicesList']) {
        this.presentServiceListModal('ServiceModal', this.memoryService.getData()['servicesList']);
      } else {
        this.createRequestService.setPostData({}).then(()=>{
          // the api is called only after the setPostData promise is resolved 
          this.createRequestService.customPsuedoSubscribe('getServicesObservable').subscribe((data)=>{
            if(data[0].StatusCode === 0) {
              this.memoryService.updateLocalMemory('servicesList', data[1]);
              setTimeout(() => {
                  this.presentServiceListModal('ServiceModal', data[1]);
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

    setInputArr(items) {
      let arr = [];
      for (var index = 1; index < items.length; index++) {
        let obj = {
          type : "radio",
          label: items[index].Text,
          value: items[index].ID
        }
        if (this.createReqObj.time_mode === obj.value) obj['checked'] = true;
        arr.push(obj);        
      }
      return arr;
    }

    updateTimeBlock() {
 
      let prompt = this.alertCtrl.create({
        subTitle: 'Choose the time block',
        inputs : this.setInputArr(this.timeBlocks),
        buttons : [{
            text: "OK",
            handler: data => {
            console.log("search clicked : ", data);
              this.createReqObj.time_mode = data;
              console.log(this.timeBlocks.filter(obj => {return obj.ID === data})[0].Text)
              this.createReqObj.time_mode_display = this.timeBlocks.filter(obj => {return obj.ID === data})[0].Text;
            }
        }]
      });
        prompt.present();
    }

    getTimeBlocks() {
      if (this.memoryService.getData()['timeBlocks']) {
          console.log("memory") 
          this.timeBlocks = this.memoryService.getData()['timeBlocks'];
          this.setTimeBlock();
      } else {
        this.createRequestService.setPostData({}).then(()=>{
          // the api is called only after the setPostData promise is resolved 
          this.createRequestService.customPsuedoSubscribe('getTimeblocksObservable').subscribe((data)=>{
            if(data[0].StatusCode === 0) {
              this.timeBlocks = data[1];
              this.memoryService.updateLocalMemory('timeBlocks', data[1]);
              this.setTimeBlock();
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

    setTimeBlock() {
      let hour = new Date().getHours();
      let index = Math.floor(hour/APP_CONFIG.reqBlockInteval);
      this.createReqObj.time_mode = this.timeBlocks[(index+1)].ID;
      this.createReqObj.time_mode_display = this.timeBlocks[(index+1)].Text;
    }

    presentServiceListModal(modal, data) {
      this.serviceListModal = this.modalCtrl.create(modal, {data: data});
      this.serviceListModal.onDidDismiss(res => {
        if(res) {
          switch(res.modal) {
            case 'SERVICE': {
              if(res.service_id) {
                this.createReqObj.service_id = res.service_id;
                this.createReqObj.service_name = res.service_name;
              }
              break;
            }
            case 'MAP': {
              if(res.latLng.lat) {
                this.createReqObj.latitude = res.latLng.lat.toString();
                this.createReqObj.longitude = res.latLng.lng.toString();
              }
              console.log(this.createReqObj);
              break;
            }
            case 'IMAGE': {
              this.createReqObj.image = res.items;
              if(res.isAttach) this.presentImgActionSheet();
              console.log(this.createReqObj);
              //this.hideLoading();
              break;
            }
            
          }

        }
      });
      this.serviceListModal.present();
    }

    ionViewWillLeave() {
      this.serviceListModal.dismiss();
    }

    onRequestSubmit() {
      console.log("onRequestSubmit");
    }

    formatDate(dateString) {
      console.log(dateString);
      let arr = dateString.split("/");
      let formattedDate = arr[1]+"/"+arr[0]+"/"+arr[2];
      return new Date(formattedDate);
    }

    datepicker() {
      this.datePicker.show({
        date: new Date(this.formatDate(this.createReqObj.required_date)),
        mode: 'date',
        androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT,
        minDate : new Date().valueOf(),
        okText : this.translateService.instant('COMMON.OK'),
        cancelText : this.translateService.instant('COMMON.CLOSE')

      }).then(
        date => {
          console.log('Got date: ', date);
          this.createReqObj.required_date = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
        },
        err => {console.log('Error occurred while getting date: ', err)}
      );
    }


    // post api call
    reqSubmit() {
      /*
        In this project we need to set requestHeader object as a property to the postObj.
        So we set the postObject first and on resolving that promise, we call the post api.
        Note that, this promise never gets rejected as per our framework
      */

      let formatImageArr = (arr) => {
        return arr.reduce((filtered, currentValue) => {
          filtered.push({"source" : currentValue });
          return filtered
        }, []);
      }
      let formatDateString = (dataStr) => {
        let splitArr = dataStr.split('/');
        return splitArr[1]+'/'+splitArr[0]+'/'+splitArr[2];
      }
      let postObj = {
            // ADD for creating a request
            mode: "ADD",
            mast: { 
              service_request_id: "", // no ID on creating
              service_id: this.createReqObj.service_id, 
              contact_name: this.createReqObj.contact_name,
              contact_number: this.createReqObj.contact_number,
              description: this.createReqObj.description ,
              required_date: formatDateString(this.createReqObj.required_date), 
              latitude: this.createReqObj.latitude, 
              longitude: this.createReqObj.longitude, 
              time_mode: this.createReqObj.time_mode
            },
            ImageList: formatImageArr(this.createReqObj.image),
      }
      this.createRequestService.setPostData(postObj).then(()=>{
        // the api is called only after the setPostData promise is resolved 
        this.createRequestService.customPsuedoSubscribe('createRequestObservable').subscribe((data)=>{
          this.requestFormGroup.reset();
          this.setReqObj();
          this.resetMemory();
          //this.requestFormGroup.controls.listOptions.reset()
          if(data[0].StatusCode === 0) {
            setTimeout(() => {
              // do stuff
              console.log("yo yoy");
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

    submitRequest() {
      if(this.selectedMap === "CURRENT") {
        this.geolocation.getCurrentPosition().then((position) => {
        }, (err) => {
          console.log(err);
        });
      } else if (this.selectedMap === "BASE") {
        this.createReqObj.latitude = this.cacheMemoryService.getJSON('loginResponse').latitude.toString();
        this.createReqObj.longitude = this.cacheMemoryService.getJSON('loginResponse').longitude.toString();
      }
      console.log("here", this.createReqObj);
      this.reqSubmit();
    }

}

interface CreateReqObj {
  service_id : string;
  service_name : string;
  description : string;
  latitude : string;
  longitude : string;
  contact_name: string, 
  contact_number: string,
  required_date : string,
  time_mode : string,
  time_mode_display : string,
  image : Array<string>
}