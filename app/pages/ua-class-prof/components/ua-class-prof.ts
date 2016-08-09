import {Component} from '@angular/core';
import {TAB_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-class-prof',
	templateUrl: 'ua-class-prof.html',
  directives: [[TAB_DIRECTIVES, ROUTER_DIRECTIVES]]
})


export class ClassProfComponent {
  classe: any;
  newExerciseName: string;
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    let finishGetClass = function(data: any) {
      scope.classe = data;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(curr.getParam('id'))
    });
    this._http.post(globals.backendURL + '/restricted/class/prof/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetClass(data),
        err => this._router.navigate(['/dashboard', '/home']),
        () => console.log('Got class')
      );
  }
  constructor( private _router: Router, private _http: Http ) { }
  changeJoinCode() {
    let scope = this;
    let finishChangeJoinCode = function(data: any) {
      scope.classe.joinCode = data.joinCode;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(this.classe.classID),
    });
    this._http.post(globals.backendURL + '/restricted/class/prof/change-join-code', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishChangeJoinCode(data),
        err => console.log(err),
        () => console.log('Changed join code')
      );
  }
  deleteClass() {
    let scope = this;
    let finishDeleteClass = function(data: any) {
      scope.classe.className = 'Deleted class; reloading app…';
      location.reload(true);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(this.classe.classID),
    });
    this._http.post(globals.backendURL + '/restricted/class/prof/delete', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishDeleteClass(data),
        err => console.log(err),
        () => console.log('Deleted class')
      );
  }
  renameClass() {
    let scope = this;
    let newClassName = prompt('Rename class to:');
    if (!newClassName)
      return;
    let finishRenameClass = function(data: any) {
      scope.classe.className = 'Renamed class; reloading app…';
      location.reload(true);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(this.classe.classID),
      'newClassName': newClassName
    });
    this._http.post(globals.backendURL + '/restricted/class/prof/rename', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRenameClass(data),
        err => console.log(err),
        () => console.log('Renamed class')
      );
  }
  newExercise(newExerciseName: string) {
    let scope = this;
    let finishNewExercise = function(data: any) {
      scope.classe.exercises.push({
        exerciseID: data.exerciseID,
        exerciseName: newExerciseName,
        dateStart: '',
        dateEnd: ''
      });
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(this.classe.classID),
      'newExerciseName': newExerciseName
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/new', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishNewExercise(data),
        err => console.log(err),
        () => console.log('Made new exercise')
      );
  }
}
