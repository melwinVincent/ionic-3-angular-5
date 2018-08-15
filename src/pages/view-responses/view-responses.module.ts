import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ViewResponses } from './view-responses';

@NgModule({
  declarations: [
    ViewResponses,
  ],
  imports: [
    IonicPageModule.forChild(ViewResponses),
  ],
})
export class ViewResponsesModule {}
