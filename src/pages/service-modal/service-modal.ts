import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';
import { MemoryService } from '../../services/memory.service';
@IonicPage()
@Component({
  selector: 'service-modal',
  templateUrl: 'service-modal.html',
})
export class ServiceModal {
  items : Array<any>;
  selectedItemID : string;
  parentItemID : string;
  selectedItem : string;
  constructor(private viewController : ViewController,  private navParams : NavParams, private memoryService : MemoryService) {
  }

  ionViewDidLoad() {
    this.selectedItemID = this.memoryService.getData().selectedItemID;
    this.parentItemID = this.memoryService.getData().parentItemID;
    this.selectedItem = this.memoryService.getData().selectedItem;
    this.items = this.navParams.get('data');

  }

  setMemoryData() {
    this.memoryService.updateLocalMemory('parentItemID', this.parentItemID);
    this.memoryService.updateLocalMemory('selectedItemID', this.selectedItemID);
    this.memoryService.updateLocalMemory('selectedItem', this.selectedItem)
  }

  closeModal(isCancel) {
    if(!isCancel) this.setMemoryData();
    let data = isCancel ? "" : {
        modal : 'SERVICE',
        service_id : this.selectedItemID,
        service_name : this.selectedItem
    }
    this.viewController.dismiss(data);
  }
  
  itemClicked(item, parentItemID) {
      // clicking on arrow
      if(item.SubService && item.SubService.length > 0) {
            item.openSublist = !item.openSublist;
      } else {
            // for all the items
            this.selectedItemID = item.service_id;
            this.selectedItem = item.service_name;
            if(parentItemID) {
                this.parentItemID = parentItemID
            } else {
                this.parentItemID = "";
            }
      }
  }
}
