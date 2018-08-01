import { Component } from '@angular/core';
import { Events, AlertController, IonicPage } from 'ionic-angular';
import { TodosService } from '../../services/todos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@IonicPage()
@Component({
  selector: 'page-todos',
  templateUrl: 'todos.html',
})

export class TodosPage {
  // interface is defined below the class
  todoObj: TodoInterface;
  todos: Array<any>;
  // for filtering
  todosClone : Array<any>;
  addTodoFormGroup: FormGroup;
  toggleStatus : Boolean;
  todoSegment : String = "ALL";
  setTodoObj : Function;
  // https://stackoverflow.com/questions/46596399/typescript-dependency-injection-public-vs-private
  constructor(
    private todosService: TodosService, 
    private events: Events,
    private formBuilder: FormBuilder,
    private alertCtrl: AlertController) {
    // to initialize the todo object
    this.setTodoObj = () => {
      this.todoObj = {
        todo : "",
        isDone : false,
        hasAttachment : false
      }
    }
    // call to initialize
    this.setTodoObj();
  }
  
  //called after the constructor and called  after the first ngOnChanges() 
  ngOnInit(){
    // get data
    this.get('todosObservable', true);
    // for validation
    this.addTodoFormGroup = this.formBuilder.group({
        todo: ['', Validators.compose([Validators.maxLength(100),Validators.required])]
    });
  }
  // for toasting
  toast(msg:string) {
    this.events.publish('toast', msg);
  }
  // get method call
  // pass boolean true or 'ALL' to fetch all the data
  get(observableInstance, allSegment) {
    /*customPsuedoSubscribe returns an Observable and we need to subscribe to that 
      observable to get the data returned using next(), complete() or error() from the Observable in the service
    */ 
    this.todosService.customPsuedoSubscribe(observableInstance).subscribe((data)=>{
      // data passed in next comes here
      this.todosClone = data.reverse();
      this.todos = this.todosClone.slice();
      let tabSegment = allSegment ? 'ALL' : this.todoSegment;
      // for JSON filtering
      this.getItems(tabSegment);
      this.todoSegment = tabSegment;
    });
  }
  // for cancelling an api call
  cancel(observerName) {
    this.todosService.cancel(observerName);
  }  
  // post api call
  onAddTodo() {
    this.todosService.setPostData(this.todoObj);
    this.todosService.customPsuedoSubscribe('postTodoObservable').subscribe((data)=>{
      this.toast(data);
      this.get('todosObservable',true);
      this.addTodoFormGroup.reset();
      this.setTodoObj();
    });
  }

  // on filtering
  getItems(queryParam : String) {
    // filter the iterating array, cloned array is intact at this point
    this.todos = this.todosClone.slice();
    switch (queryParam) {
      case 'ALL' : {
        // do nothing
        break;
      }
      case 'COMPLETED' : {
        this.todos = this.todos.filter((item) => {
          if (item.isDone === true) {
            return true;
          }
          return false;
        });
        break;
      }
      case 'PENDING' : {
        this.todos = this.todos.filter((item) => {
          if (item.isDone === false) {
            return true;
          }
          return false;
        });
        break;
      }
    }

    console.log(this.todos.length);
    
  }
  // called on toggling from template
  toggled(item) {
    console.log("item : ",item);
    this.todosService.setPostData(item);
    this.todosService.customPsuedoSubscribe('postTodoObservable').subscribe((data)=>{
      this.toast(data);
      this.getItems(this.todoSegment);
    });
  }
  // called from presentConfirm method below
  deleteTodo(id) {
    console.log("id is : ",id);
    // set the _id param, _id is an auto-generated value for the item
    this.todosService.setPostData({_id:id});
    this.todosService.customPsuedoSubscribe('deleteTodoObservable').subscribe((data)=>{
      this.toast(data);
      console.log("here deleted and ", this.todoSegment);
      this.get('todosObservable', false);
    });
  }

  presentConfirm(id) {
    let alert = this.alertCtrl.create({
      title: 'Are you sure ?',
      message: 'Do you want to delete this task',
      buttons: [
        {
          text: 'NO',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'YES',
          handler: () => {
            this.deleteTodo(id);
          }
        }
      ]
    });
    alert.present();
  }

}

interface TodoInterface {
	"todo" : string,
	"isDone" : boolean,
	"hasAttachment" : boolean
}
