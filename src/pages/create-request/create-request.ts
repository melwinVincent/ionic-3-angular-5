import { Component, ViewChild } from '@angular/core';
import { IonicPage, Events, ModalController, Modal, AlertController, ActionSheetController, LoadingController, Loading, NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, NgForm } from '@angular/forms';
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
  // for reseting the from on ionViewDidLeave
  @ViewChild('requestForm') form: NgForm;
  // for displaying the loader animation
  loading : Loading;
  // only one modal for this page
  serviceListModal : Modal;
  // modal object
  createReqObj : CreateReqObj;
  // for validation
  requestFormGroup: FormGroup;
  // for the time blocks popup
  timeBlocks : any = [];
  // component variable, not used in template
  selectedMap : string = "CURRENT";
  // to manage displaying blocks in template
  isUpdate : boolean = false;
  // to manage the disable effect of Submit button
  isRequestFormInvalid : boolean = true;
  /*
    custom variable to manage validation in template,
    set to true on form submission and is set to false on ionViewDidLeave
  */
  requestFormSubmitted : boolean = false;
  // for camera / gallery upload
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
      public geolocation: Geolocation,
      private navCtrl : NavController

    ) {
      // for validation
      this.requestFormGroup = this.formBuilder.group(
        {
          service : ['', Validators.compose([
            Validators.required])],
          description: ['', Validators.compose([
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(200)
          ])],
          requiredDate : ['', Validators.compose([
            Validators.required])],
          requiredTime : ['', Validators.compose([
            Validators.required])]
        }
      );
    }

    ngOnInit() {
      // initialization is always better in ngOnInit as per internet articles
      this.setReqObj(false);
      // calls POST API for fetching service types
      // once fecthed, resposnse is stored in memory
      this.getServiceTypes();
      // calls POST API for fetching time blocks
      // once fecthed, resposnse is stored in memory
      this.getTimeBlocks(false);
    }

    // always gets called on navigating to this page
    ionViewDidEnter() {
      // on update call, object is passed through the memoryService
      // requestObj in memoryService is set to {} on ionViewDidLeave
      if(this.memoryService.getData().requestObj && this.memoryService.getData().requestObj.reqData) {
        // set the modal object with the passed object 
        this.setReqObj(this.memoryService.getData().requestObj);
        this.isUpdate = true;
        this.isRequestFormInvalid = false;
        // to change the tab title in home page (tabs are actually in home page)
        this.events.publish('update:home-label', 'Update Request');
        // new promise, time_mode_display is passed from the other page, it's not stored in DB instead a code is saved.
        this.getTimeBlocksPromise().then((data)=> { 
          let arr : any = data;
          this.createReqObj.time_mode_display = arr.filter(obj => {return obj.ID === this.createReqObj.time_mode})[0].Text;
        });

      } else {
        // setReqObj function is not called on create
        this.isUpdate = false;
      }
    }

    // method to set the object
    // data is false on create and an object on update
    setReqObj(data) {
      // on update, selectedMap is "MAP", used for viewLocation function
      if(data && data.reqData && data.reqData[0] && data.reqData[0].latitude) this.selectedMap = "MAP";

      // default today is set on required_date
      let today :any = new Date();
      today = today.getDate() + "/" + ((Number(today.getMonth()) < 9) ? '0'+(today.getMonth()+1) : today.getMonth()+1) + "/" + today.getFullYear();
      
      this.createReqObj = {
        service_request_id : data && data.reqData ? data.reqData[0].service_request_id : "",
        service_id : data && data.reqData ? data.reqData[0].service_id : "",
        service_name : data && data.reqData ? data.reqData[0].service_name : "",
        description : data && data.reqData ? data.reqData[0].description : "",
        latitude : data && data.reqData ? data.reqData[0].latitude : "",
        longitude : data && data.reqData ? data.reqData[0].longitude : "",
        contact_name: this.cacheMemoryService.getJSON('loginResponse').username , 
        contact_number: this.cacheMemoryService.getJSON('loginResponse').userPhone,
        required_date : data && data.reqData ? data.reqData[0].required_date : today,
        time_mode : data && data.reqData ? data.reqData[0].time_mode : "",
        time_mode_display : data && data.reqData ? data.reqData[0].time_mode_display : "",
        image : data && data.images && data.images.length > 0 ? this.setImages(data.images) : APP_CONFIG.imageArr // for testing
      }

    }
    // called on didLeave
    resetMemory() {
      this.memoryService.updateLocalMemory('parentItemID', "");
      this.memoryService.updateLocalMemory('selectedItemID', "");
      this.memoryService.updateLocalMemory('selectedItem', "");
      this.memoryService.updateLocalMemory('latLng', {});
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

    // for toasting
    toast(msg:string) {
      this.events.publish('toast', msg);
    }

    // on clicking the view location block in template
    viewLocation(){

      if (this.selectedMap === "CURRENT") {
        this.presentServiceListModal('MapModal', {isDraggable:false});
      } else if (this.selectedMap === "BASE") {
        this.presentServiceListModal('MapModal', {isDraggable:false, isBASE:true});
      } else {
        // on updating pass the lat and lng
        if(this.createReqObj.latitude) {
          this.presentServiceListModal('MapModal', {isDraggable:true, lat:this.createReqObj.latitude, lng:this.createReqObj.longitude });
        } else {
          this.presentServiceListModal('MapModal', {isDraggable:true});
        }
      }

    }

    /************* codes related to images *************/

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

    showImages() {
      //this.presentLoading();
      this.presentServiceListModal('ImageModal', { imgs : this.createReqObj.image, isReadonly : false});
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

    // to format the array to an Array<string>
    setImages(data) {
      let imgStringArr = data.map((val, i, arr) => {
        return val.source;
      });
      return imgStringArr;
    }

    /************* end of codes related to images *************/

    // called from template
    openMap(val) {
      this.selectedMap = val;
      if(val === "MAP"){
        this.presentServiceListModal('MapModal', {isDraggable:true});
      }
    }

    getServiceTypes() {
      if (this.memoryService.getData()['servicesList']) {
        this.presentServiceListModal('ServiceModal', this.memoryService.getData()['servicesList']);
      } else {
        this.createRequestService.setPostData({}).then(()=>{
          // the api is called only after the setPostData promise is resolved 
          this.createRequestService.customPsuedoSubscribe('getServicesObservable').subscribe((data)=>{
            //console.log(data);
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
    // called from the below function
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
    // called from template to display the alert popup for selecting timeblocks
    updateTimeBlock() {
      // if required_date is not set, then return throwing a toast
      if(!this.createReqObj.required_date) {
        this.toast("Please select the required date first");
        return;
      }

      let timeBlocks;
      let today :any = new Date();
      today = today.getDate() + "/" + ((Number(today.getMonth()) < 9) ? '0'+(today.getMonth()+1) : today.getMonth()+1) + "/" + today.getFullYear();
      // check if the required_date is set today, then show the timeBlocks accordingly (don't show past time blocks)
      if(this.createReqObj.required_date === today) {
        let hour = new Date().getHours();
        let index = Math.floor(hour/APP_CONFIG.reqBlockInteval);
        timeBlocks = this.timeBlocks.slice(index);
      } else {
        timeBlocks = this.timeBlocks;
      }
      
      let prompt = this.alertCtrl.create({
        subTitle: 'Choose the time block',
        inputs : this.setInputArr(timeBlocks),
        buttons : [{
            text: "OK",
            handler: data => {
              if(data) {
                this.createReqObj.time_mode = data;
                this.createReqObj.time_mode_display = this.timeBlocks.filter(obj => {return obj.ID === data})[0].Text;
                // ngDoCheckPseudo to be called on force, refer the function 
                this.ngDoCheckPseudo();
              }
            }
        }]
      });
      prompt.present();
    }

    // same method is used for resolving a promise to set the time_mode_display on updating the request 
    getTimeBlocks(resolveGetTimeBlocks) {
      if (this.memoryService.getData()['timeBlocks']) {
          this.timeBlocks = this.memoryService.getData()['timeBlocks'];
          if(resolveGetTimeBlocks) resolveGetTimeBlocks(this.timeBlocks);
          //this.setTimeBlock();
      } else {
        this.createRequestService.setPostData({}).then(()=>{
          // the api is called only after the setPostData promise is resolved 
          this.createRequestService.customPsuedoSubscribe('getTimeblocksObservable').subscribe((data)=>{
            if(data[0].StatusCode === 0) {
              this.timeBlocks = data[1];
              if(resolveGetTimeBlocks) resolveGetTimeBlocks(this.timeBlocks);
              this.memoryService.updateLocalMemory('timeBlocks', data[1]);
              //this.setTimeBlock();
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

    // promise used to set the time_mode_display for update
    getTimeBlocksPromise = () => {
      return new Promise((resolveGetTimeBlocks, rejectGetTimeBlocks) => {
        this.getTimeBlocks(resolveGetTimeBlocks);
      });
    }

    // same function used for showing all the modals in this page
    presentServiceListModal(modal, data) {
      this.serviceListModal = this.modalCtrl.create(modal, {data: data});
      this.serviceListModal.onDidDismiss(res => {
        if(res) {
          switch(res.modal) {
            case 'SERVICE': {
              if(res.service_id) {
                this.createReqObj.service_id = res.service_id;
                this.createReqObj.service_name = res.service_name;
                // ngDoCheckPseudo to be called on force, refer the function        
                this.ngDoCheckPseudo();
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
            case 'CONFIRM' : {
              if(res.isSubmit) this.reqSubmit();
              break;
            }
            
          }

        }
      });
      this.serviceListModal.present();
    }

    // to format into dd/mm/yyyy
    formatDate(dateString) {
      console.log(dateString);
      let arr = dateString.split("/");
      let formattedDate = arr[1]+"/"+arr[0]+"/"+arr[2];
      return new Date(formattedDate);
    }
    // called from template
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
          this.createReqObj.required_date = date.getDate() + "/" + ((Number(date.getMonth()) < 9) ? '0'+((date.getMonth()+1)) : date.getMonth()+1) + "/" +date.getFullYear();
        },
        err => {console.log('Error occurred while getting date: ', err)}
      );
    }


    // POST API call , called from below function
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
        //format to mm/dd/yyyy before POST API call
        let formatDateString = (dataStr) => {
          let splitArr = dataStr.split('/');
          return splitArr[1]+'/'+splitArr[0]+'/'+splitArr[2];
        }

      let postObj = {
            // ADD for creating a request
            mode: this.createReqObj.service_request_id ?  "EDIT" : "ADD",
            mast: { 
              service_request_id: this.createReqObj.service_request_id ? this.createReqObj.service_request_id : "", // no ID on creating
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
          
          //this.requestFormGroup.controls.listOptions.reset()
          if(data[0].StatusCode === 0) {
              setTimeout(() => {
                // go to my-requests tab
                this.navCtrl.parent.select(1);
                /*
                  this.setReqObj(false);
                  this.resetMemory();
                */
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

    // on clicking the submitRequest button in footer
    submitRequest() {

      /****************** CUSTOM VALIDATION LOGIC starts ******************/

      // return from the fuction if validation fails
      
      if(!this.requestFormGroup.valid) {
          // updating the custom variable to true on invalid submit
          this.requestFormSubmitted = true;
          let formGroupControls = this.requestFormGroup.controls;
          if(formGroupControls.service.errors) {
            // only required
            this.toast("Please select a service");
          } else if (formGroupControls.description.errors) {
              // 3 validations for description
              let errors = formGroupControls.description.errors;
              if (errors.required) {
                this.toast("Please enter a short description");
              } else if (errors.minlength) {
                this.toast("Please enter minimum 5 characters");
              } else if (errors.maxlength) {
                this.toast("Description is limited to 200 characters");
              }
          } else if (formGroupControls.requiredDate.errors) {
            this.toast("Please select a date");
          } else if (formGroupControls.requiredTime.errors) {
            this.toast("Please select a time");
          } 

          return;
        
      } 

       /****************** CUSTOM VALIDATION LOGIC ends ******************/

      if(this.selectedMap === "CURRENT") {
        this.geolocation.getCurrentPosition().then((position) => {
        }, (err) => {
          console.log(err);
        });
      } else if (this.selectedMap === "BASE") {
        this.createReqObj.latitude = this.cacheMemoryService.getJSON('loginResponse').latitude.toString();
        this.createReqObj.longitude = this.cacheMemoryService.getJSON('loginResponse').longitude.toString();
      }

      // confirm popup
      this.presentServiceListModal('ConfirmRequest', {req : this.createReqObj});
    }

    ionViewWillLeave() {
      if(this.serviceListModal) this.serviceListModal.dismiss();
    }

    ionViewDidLeave() {
      // if anything is loading, hide the loader 
      this.hideLoading();
      // update the requestObj to {} in memoryService 
      if(this.memoryService.getData().requestObj && this.memoryService.getData().requestObj.reqData) this.memoryService.updateLocalMemory('requestObj', {});
      // change label on homepage
      this.events.publish('update:home-label', 'Create Request');
      // reset the form, take care not to clear the requiredDate
      this.form.resetForm({ 
        "requiredDate" : this.createReqObj.required_date 
      });
      this.setReqObj(false);
      this.resetMemory();
      // reset the custom variable used for verifying form submission
      this.requestFormSubmitted = false;
    }

    /*
      Quick fix for ExpressionChangedAfterItHasBeenCheckedError
      This function gets called manually if we make any change to the form inputs (as per our framework)
    */
    ngDoCheckPseudo() {
      /*
        timeout is necessary here. 
        let the angular finish its change detection process and assign proper value on to the 'invalid' property of requestFormGroup
        100ms is a safe delay in this case
      */
      setTimeout(() => {
        this.isRequestFormInvalid = this.requestFormGroup.invalid;
      }, 100);

    }

}

interface CreateReqObj {
  service_request_id : string;
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