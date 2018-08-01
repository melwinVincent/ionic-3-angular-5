import { Component, ViewChild } from '@angular/core';
import { IonicPage, ViewController, NavParams, Slides } from 'ionic-angular';
import { CacheMemoryService } from '../../services/cache.memory.service';

@IonicPage()
@Component({
  selector: 'page-image-modal',
  templateUrl: 'image-modal.html',
})
export class ImageModal {
  items : Array<string>;
  initialSlide : number;
   @ViewChild(Slides) slides: Slides;
  constructor(private viewController : ViewController,  private navParams : NavParams, private cacheMemoryService : CacheMemoryService) {
  }
  

  ionViewDidLoad() {
    console.log('ionViewDidLoad ImageModal');
    if (this.cacheMemoryService.get("language") === "en") {
      this.items = this.navParams.get('data');
      this.initialSlide = 0;
    } else {
      this.items = this.navParams.get('data').reverse();
      this.initialSlide = this.items.length - 1;
    }
  }

  deleteImg() {
    let index = this.slides.getActiveIndex();
    this.items.splice(index,1);
    if(this.items.length && this.items.length > 0) {
      this.slides.slidePrev();
    } else {
      this.closeModal(false);
    }
  }

  closeModal(isAttach) {
    let data = {
        modal : 'IMAGE',
        items : this.items,
        isAttach : isAttach ? isAttach : false
    }
    this.viewController.dismiss(data);
  }

}
