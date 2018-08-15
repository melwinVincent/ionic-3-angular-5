import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams} from 'ionic-angular'

@IonicPage()
@Component({
  selector: 'page-confirm-request',
  templateUrl: 'confirm-request.html',
})
export class ConfirmRequest {
  navData : any;
  closeModal : Function;
  constructor(
    private viewController : ViewController, 
    private navParams : NavParams,
    ) {
      
      this.navData = this.navParams.get('data').req;

      this.closeModal = (isSubmit) => {
        let data = {
            modal : 'CONFIRM',
            isSubmit : isSubmit
        }
        this.viewController.dismiss(data);
      }

    }
}