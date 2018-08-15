import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MyRequests } from './my-requests';
import { SharedTranslateModule } from '../../app/app.translate.shared.module';
@NgModule({
  declarations: [
    MyRequests,
  ],
  imports: [
    IonicPageModule.forChild(MyRequests),
    SharedTranslateModule
  ],
})
export class MyRequestsModule {}
