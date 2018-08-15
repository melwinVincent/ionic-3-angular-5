import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ConfirmRequest } from './confirm-request';
import { SharedTranslateModule } from '../../app/app.translate.shared.module';

@NgModule({
  declarations: [
    ConfirmRequest,
  ],
  imports: [
    IonicPageModule.forChild(ConfirmRequest),
    SharedTranslateModule
  ],
})
export class ConfirmRequestModule {}
