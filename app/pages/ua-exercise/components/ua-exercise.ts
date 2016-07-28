import {Component, OnInit} from '@angular/core';
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
declare var jQuery: any;
import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

@Component({
	moduleId: module.id,
	selector: 'ua-exercise',
	templateUrl: 'ua-exercise.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, ROUTER_DIRECTIVES, AlertComponent, Dragula]],
  viewProviders: [DragulaService]
})

export class ExerciseComponent implements OnInit {
  alerts: Array<Object> = [];
  exercise: any;
  otherExercises: any;
  reposition: boolean = true;
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    let finishGetExercise = function(data: any) {
      scope.exercise = data;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(curr.getParam('id'))
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetExercise(data),
        err => this._router.navigate(['/dashboard', '/home']),
        () => console.log('Got exercise')
      );
    // Get other exercises
    let finishGetOtherExercises = function(data: any) {
      scope.otherExercises = data.otherExercises;
    };
    this._http.post(globals.backendURL + '/restricted/exercise/prof/other-exercises', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetOtherExercises(data),
        err => console.log(err),
        () => console.log('Got other exercises')
      );
  }
  ngOnInit():any {
    let scope = this;
    //ORPHA TODO
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      cancelButton: false,
      filter: false,
      source: {
        diseases: {
          ajax: {
            url: globals.backendURL + '/solr/omim/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.addProblem(item.display);
        }
      }
    });
    jQuery(document).on('mousemove', function(e: any){
      jQuery('.hover-box').css({
        left:   e.clientX - 320,
        bottom: window.innerHeight - e.clientY
      });
    });
  }
  addProblem(diseaseName: string) {
    let scope = this;
    let finishAddProblem = function(data: any) {
      scope.exercise.problems.push(data);
      jQuery('.js-typeahead').val('');
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID),
      'diseaseName': diseaseName,
      'vocabulary': 'omim' //ORPHO TODO
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/add', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishAddProblem(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot add disease. Has it already been added?',
          closable: true
        }),
        () => console.log('Added problem')
      );
  }
  constructor( private _router: Router, private _http: Http, private dragulaService: DragulaService ) {
    let scope = this;
    dragulaService.setOptions('problems', {
      accepts: function (el: any, target: any, source: any, sibling: any) {
        return true;
      },
      invalid: function (el: any, handle: any) {
        return !scope.reposition;
      }
    });
    dragulaService.drag.subscribe((value: any) => {
      jQuery('.problem').css('cursor', 'grabbing');
      jQuery('.hover-box').show();
    });
    dragulaService.dragend.subscribe((value: any) => {
      jQuery('.hover-box').hide();
    });
    dragulaService.cancel.subscribe((value: any) => {
      jQuery('.problem').css('cursor', 'grab');
    });
    dragulaService.drop.subscribe((value: any) => {
      let finishRepositionProblem = function(data: any) {
        scope.reposition = true;
        jQuery('.problem').css('cursor', 'grab');
      };
      this.reposition = false;
      jQuery('.problem').css('cursor', 'wait');
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'exerciseID': parseInt(this.exercise.exerciseID),
        'problemID': value[1].id.match(/\d+/)[0],
        'afterProblemID': (value[4]) ? value[4].id.match(/\d+/)[0] : null
      });
      this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/reposition', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishRepositionProblem(data),
          err => console.log(err),
          () => console.log('Repositioned problem')
        );
    });
  }
  deleteExercise() {
    let scope = this;
    let finishDeleteExercise = function(data: any) {
      this._router.navigate(['/dashboard', '/class-prof', scope.exercise.classID]);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID)
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/delete', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishDeleteExercise(data),
        err => console.log(err),
        () => console.log('Deleted exercise')
      );
  }
  renameExercise() {
    let scope = this;
    let newExerciseName = prompt('Rename exercise to:');
    if (!newExerciseName)
      return;
    let finishRenameExercise = function(data: any) {
      scope.exercise.exerciseName = newExerciseName;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID),
      'newExerciseName': newExerciseName
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/rename', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRenameExercise(data),
        err => console.log(err),
        () => console.log('Renamed exercise')
      );
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    localStorage.setItem('uaPhenositoryDisease', diseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  lookUpDisease(diseaseName: string) {
    window.open(globals.omimURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
  }
  removeProblem(problemID: number) {
    let scope = this;
    let finishRemoveProblem = function(data: any) {
      for (let i = 0; i < scope.exercise.problems.length; i++) {
        if (scope.exercise.problems[i].problemID === problemID)
          scope.exercise.problems.splice(i, 1);
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': scope.exercise.exerciseID,
      'problemID': problemID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveProblem(data),
        err => console.log(err),
        () => console.log('Removed problem')
      );
  }
  copyProblems(exerciseID: number) {
    if (!confirm('The existing diseases in the target exercise will be deleted. This cannot be undone'))
      return;
    let scope = this;
    let finishCopyProblems = function(data: any) {
      scope._router.navigate(['/dashboard', '/exercise', exerciseID]);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': scope.exercise.exerciseID,
      'toExerciseID': exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/copy', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishCopyProblems(data),
        err => console.log(err),
        () => console.log('Copied problems')
      );
  }
}
