import {Component, HostListener, OnInit} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
declare var jQuery: any;
import {DROPDOWN_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-my-annotations',
	templateUrl: 'ua-my-annotations.html',
  directives: [[AlertComponent, ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES]]
})


export class MyAnnotationsComponent implements OnInit {
  following: boolean;
  diseaseSelected: boolean = false;
  newAnnotationDisease: string;
  newAnnotationDiseaseDB: string = 'ordo';
  typeAheadBox: string;
  prefillAvailable: boolean = true;
  alerts: Array<Object> = [];
  constructor( private _router: Router, private _http: Http) {
    let gotMyAnnotations = function (data: any) {
      // ngFor and ngRepeat do not work with DataTable!
      let tableBody = '';
      for (let i = 0; i < data.annotations.length; i++) {
        tableBody += '<tr style="cursor: pointer" onclick="localStorage.setItem(\'uaAnnotationTemp\',\'' +
          data.annotations[i].id + '\')"><td>';
        if (data.annotations[i].status === 1) {
          tableBody += '<i class="fa fa-pencil" aria-hidden="true" title="Draft (not yet published)"></i>';
        } else {
          tableBody += data.annotations[i].id;
        }
        tableBody += '</td><td>' +
          data.annotations[i].diseaseName + '</td><td>' + data.annotations[i].date + '</td></tr>';
      }
      jQuery('#table-body-my-annotations').html(tableBody);
      jQuery('#table-my-annotations').DataTable({
        'order': [[ 2, 'desc' ]],
        'language': {
          'emptyTable': 'You have no annotations.<br />Why not create or clone one from the Phenository?'
        }
      });
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/annotations/prof/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotMyAnnotations(data),
        err => console.log(err),
        () => console.log('Got my annotations')
      );
  }
  @HostListener('document:click') onMouseEnter() {
    if (localStorage.getItem('uaAnnotationTemp')) {
      let id = localStorage.getItem('uaAnnotationTemp');
      localStorage.removeItem('uaAnnotationTemp');
      this._router.navigate(['/dashboard', '/in-progress', id]);
    }
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
            url: globals.backendURL + '/solr/ordo/{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.newAnnotationDisease = item.display;
          scope.newAnnotationDiseaseDB = 'ordo';
          localStorage.setItem('uaMyAnnotationsDisease', item.display);
          localStorage.setItem('uaMyAnnotationsDiseaseDB', scope.newAnnotationDiseaseDB);
          scope.selectDisease();
        }
      }
    });
    jQuery('.js-typeahead-omim').typeahead({
      dynamic: true,
      cancelButton: false,
      filter: false,
      source: {
        diseases: {
          ajax: {
            url: globals.backendURL + '/solr/omim/{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.newAnnotationDisease = item.display;
          scope.newAnnotationDiseaseDB = 'omim';
          localStorage.setItem('uaMyAnnotationsDisease', item.display);
          localStorage.setItem('uaMyAnnotationsDiseaseDB', scope.newAnnotationDiseaseDB);
          scope.selectDisease();
        }
      }
    });
    if (localStorage.getItem('uaMyAnnotationsDiseaseDB') !== null) {
      this.newAnnotationDiseaseDB = localStorage.getItem('uaMyAnnotationsDiseaseDB');
      this.setDB(this.newAnnotationDiseaseDB);
    }
    // Restore right panel (list of annotations pertaining to selected disease)
    if (localStorage.getItem('uaMyAnnotationsDisease') !== null) {
      this.newAnnotationDisease = localStorage.getItem('uaMyAnnotationsDisease');
      this.selectDisease();
    }
    if (localStorage.getItem('uaSearch') !== null) {
      localStorage.removeItem('uaSearch');
      jQuery('.js-typeahead').focus();
    }
  }
  selectDisease() {
    jQuery('.col-lg-8').attr('class', 'col-lg-5');
    jQuery('.col-lg-4').hide();
    this.diseaseSelected = true;
    this.checkFollowing();
    this.listDiseaseAnnotations();
    this.newAnnotationPrecheck();
  }
  clearDisease() {
    jQuery('.col-lg-5').attr('class', 'col-lg-8');
    jQuery('.col-lg-4').show();
    this.diseaseSelected = false;
    this.typeAheadBox = '';
    localStorage.removeItem('uaMyAnnotationsDisease');
  }
  lookUpDisease() {
    if (this.newAnnotationDiseaseDB === 'omim') {
      window.open(globals.omimURL + this.newAnnotationDisease.substr(0,
        this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    } else if (this.newAnnotationDiseaseDB === 'ordo') {
      window.open(globals.ordoURL + this.newAnnotationDisease.substr(0,
        this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    }
  }
  newAnnotationPrecheck() {
    let scope = this;
    let finishPrecheck = function (data:any) {
      scope.prefillAvailable = data.prefillAvailable;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'diseaseName': this.newAnnotationDisease.substr(0, this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.newAnnotationDiseaseDB
    });
    this._http.post(globals.backendURL + '/restricted/annotations/new-annotation-precheck', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishPrecheck(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  listDiseaseAnnotations() {
    let gotAnnotations = function (data:any) {
      let tableBody = '';
      for (let i = 0; i < data.annotations.length; i++) {
        tableBody += '<tr style="cursor: pointer" onclick="localStorage.setItem(\'uaAnnotationTemp\',\'' +
          data.annotations[i].annotationID + '\')">';
        tableBody += '<td>' + data.annotations[i].annotationID + '</td>';
        tableBody += '<td>' + ((data.annotations[i].cloneOf) ? data.annotations[i].cloneOf : '–' ) + '</td>';
        tableBody += '<td>' + data.annotations[i].author + '</td>';
        tableBody += '<td>' + data.annotations[i].numClones + '</td>';
        tableBody += '<td>' + data.annotations[i].numLikes + '</td>';
        tableBody += '<td>' + data.annotations[i].date + '</td>';
        tableBody += '</tr>';
      }
      jQuery('#table-body-disease').html(tableBody);
      jQuery('#table-annotations').DataTable({
        'language': {
          'emptyTable': 'There are no annotations for this disease.<br />Be the first to make one!'
        }
      });
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.newAnnotationDisease.substr(0, this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.newAnnotationDiseaseDB
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/annotations', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotAnnotations(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  createAnnotation(startFromScratch: boolean, publishTemporarily: boolean) {
    let scope = this;
    this.alerts = [];
    let diseaseName = this.newAnnotationDisease;
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Invalid disease',
          closable: true
        });
        scope.newAnnotationDisease = diseaseName;
      }
    };
    if (this.newAnnotationDisease !== null) {
      this.newAnnotationDisease = '';
      // Create new annotation
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'diseaseName': diseaseName,
        'vocabulary': this.newAnnotationDiseaseDB,
        'startFromScratch': startFromScratch,
        'publishTemporarily': publishTemporarily
      });
      this._http.post(globals.backendURL + '/restricted/annotations/prof/new-annotation', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishCreateAnnotation(data),
          err => console.log(err),
          () => console.log('Created annotation')
        );
    }
  }
  checkFollowing() {
    let scope = this;
    let gotFollowing = function (data:any) {
      scope.following = data.following;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.newAnnotationDisease.substr(0,
        this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.newAnnotationDiseaseDB
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/following', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotFollowing(data),
        err => console.log(err),
        () => console.log('Got following')
      );
  }
  toggleFollow() {
    let scope = this;
    let gotFollowing = function (data:any) {
      scope.following = data.following;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.newAnnotationDisease.substr(0,
        this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.newAnnotationDiseaseDB,
      'follow': !this.following
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/follow', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotFollowing(data),
        err => console.log(err),
        () => console.log('Got following')
      );
  }
  setDB(db:string) {
    this.newAnnotationDiseaseDB = db;
    localStorage.setItem('uaMyAnnotationsDiseaseDB', this.newAnnotationDiseaseDB);
    if (this.newAnnotationDiseaseDB === 'ordo') {
      jQuery('#omim-form').hide();
      jQuery('#ordo-form').show();
    }
    if (this.newAnnotationDiseaseDB === 'omim') {
      jQuery('#omim-form').show();
      jQuery('#ordo-form').hide();
    }
  }
}
