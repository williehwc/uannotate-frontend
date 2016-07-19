import {Component, OnInit} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
declare var jQuery: any;
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

@Component({
  moduleId: module.id,
	selector: 'ua-in-progress',
	templateUrl: 'ua-in-progress.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent, ROUTER_DIRECTIVES, Dragula]],
  viewProviders: [DragulaService]
})


export class InProgressComponent implements OnInit {
  alerts: Array<Object>;
  annotation: any = null;
  liked: boolean = false;
  markUncitedPhenotypes: boolean = false;
  routerOnActivate(curr: RouteSegment) {
    if (curr.getParam('id'))
      localStorage.setItem('uaAnnotation', curr.getParam('id'));
    if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    }
    this.gotoAnnotation(localStorage.getItem('uaAnnotation'), 0);
  }
  jumpToAnnotation( annotationID: number ) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  constructor( private _router: Router, private _http: Http, private dragulaService: DragulaService) {
    dragulaService.setOptions('refs', {
      accepts: function (el: any, target: any, source: any, sibling: any) {
        return false;
      },
      copy: true
    });
    dragulaService.setOptions('phenotypes', {
      invalid: function (el: any, handle: any) {
        return true; // don't prevent any drags from initiating by default
      }
    });
    dragulaService.drag.subscribe((value: any) => {
      jQuery('.ref').css('cursor', 'grabbing');
      jQuery('.hover-box').text('Release over a phenotype.');
      jQuery('.hover-box').show();
    });
    dragulaService.dragend.subscribe((value: any) => {
      jQuery('.ref').css('cursor', 'grab');
      jQuery('.hover-box').hide();
    });
    dragulaService.drop.subscribe((value: any) => {
      let elements = document.querySelectorAll(':hover');
      let element = elements[elements.length - 1];
      while (!element.id.startsWith('phenotype-') && element.parentElement)
        element = element.parentElement;
      if (!element.id.startsWith('phenotype-'))
        return;
      let scope = this;
      let finishAddCitation = function(data: any) {
        let number: number;
        for (let i = 0; i < scope.annotation.refs.length; i++) {
          if (String(scope.annotation.refs[i].refID) === value[1].id.match(/\d+/)[0]) {
            number = i + 1;
            break;
          }
        }
        for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
          if (String(scope.annotation.phenotypes[i].phenotypeID) === element.id.match(/\d+/)[0])
            scope.annotation.phenotypes[i].citations.push({refID: value[1].id.match(/\d+/)[0], number: number});
        }
      };
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.annotation.annotationID,
        'phenotypeID': element.id.match(/\d+/)[0],
        'refID': value[1].id.match(/\d+/)[0],
      });
      this._http.post(globals.backendURL + '/restricted/annotation/edit/citation/add', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishAddCitation(data),
          err => console.log(err),
          () => console.log('Finish add citation')
        );
    });
  }
  gotoAnnotation( annotationID: number, scrollPosition: number ) {
    let scope = this;
    if (annotationID === null)
      return;
    this.alerts = [];
    localStorage.setItem('uaAnnotation', '' + annotationID);
    jQuery('.add-bar').hide();
    let initializeAnnotation = function (data:any) {
      scope.annotation = data;
      if (data.status !== 2) {
        jQuery('.add-bar').show();
      }
      // Look up phenotype names
      let loadedName = function(datum: any) {
        for (let i = 0; i < data.phenotypes.length; i++) {
          if (data.phenotypes[i].hpo === datum.id) {
            data.phenotypes[i].phenotypeName = datum.name;
            data.phenotypes[i].phenotypeDefinition = datum.def;
            break;
          }
        }
        scope.annotation = data;
      };
      let loadedCitation = function(datum: any) {
        for (let i = 0; i < data.phenotypes.length; i++) {
          if (String(data.phenotypes[i].phenotypeID) === datum.phenotypeID) {
            data.phenotypes[i].citations = datum.citations;
            for (let j = 0; j < data.phenotypes[i].citations.length; j++) {
              for (let k = 0; k < data.refs.length; k++) {
                if (data.refs[k].refID === data.phenotypes[i].citations[j].refID) {
                  data.phenotypes[i].citations[j].number = k + 1;
                  break;
                }
              }
            }
            break;
          }
        }
        scope.annotation = data;
      };
      for (let i = 0; i < data.phenotypes.length; i++) {
        let body = JSON.stringify({
          'phenotypeName': data.phenotypes[i].hpo
        });
        scope._http.post(globals.backendURL + '/definition', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedName(data),
            err => console.log(err),
            () => console.log('Got name')
          );
        body = JSON.stringify({
          'token': localStorage.getItem('uaToken'),
          'annotationID': data.annotationID,
          'phenotypeID': data.phenotypes[i].phenotypeID
        });
        scope._http.post(globals.backendURL + '/restricted/annotation/view/citation', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedCitation(data),
            err => console.log(err),
            () => console.log('Got citation')
          );
      }
      // Look up refs
      let loadedRef = function(datum: any) {
        for (let i = 0; i < data.refs.length; i++) {
          if (String(data.refs[i].pmid) === datum.pmid) {
            data.refs[i].title = datum.title;
            data.refs[i].author = datum.author;
            data.refs[i].year = datum.year;
          }
        }
        scope.annotation = data;
      };
      for (let i = 0; i < data.refs.length; i++) {
        let body = JSON.stringify({
          'pmid': data.refs[i].pmid
        });
        scope._http.post(globals.backendURL + '/efetch', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedRef(data),
            err => console.log(err),
            () => console.log('Got ref')
          );
      }
      // Restore scroll position (after adding/removing phenotypes, and removing refs)
      document.documentElement.scrollTop = document.body.scrollTop = scrollPosition;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/view/full', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeAnnotation(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid annotation',
          closable: true
        }),
        () => console.log('Got full annotation')
      );
  }
  ngOnInit():any {
    let scope = this;
    let display: string;
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      filter: false,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/solr/hpo/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedPhenotype = function() {
            scope.gotoAnnotation(scope.annotation.annotationID, document.documentElement.scrollTop || document.body.scrollTop);
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'phenotypeName': item.display
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedPhenotype(),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add phenotype. Has it already been added?',
                closable: true
              }),
              () => console.log('Added phenotype')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading definition…');
          jQuery('.hover-box').show();
          let loadedDefinition = function(data: any) {
            if (data.name === display && scope.annotation.status === 0) {
              jQuery('.hover-box').html(data.def);
            } else if (data.name === display) {
              jQuery('.hover-box').html('<strong>' + data.id + '</strong><br />' + data.def);
            }
          };
          let body = JSON.stringify({
            'phenotypeName': item.display
          });
          display = item.display;
          scope._http.post(globals.backendURL + '/definition', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedDefinition(data),
              err => console.log(err),
              () => console.log('Got definition')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.js-typeahead-ref').typeahead({
      dynamic: true,
      filter: false,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/entrez/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedRef = function(data: any) {
            scope.annotation.refs.push({
              refID: data.refID,
              pmid: data.pmid,
              title: data.title,
              author: data.author,
              year: data.year
            });
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/ref/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedRef(data),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add reference. Has it already been added?',
                closable: true
              }),
              () => console.log('Added ref')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading metadata…');
          jQuery('.hover-box').show();
          let loadedMetadata = function(data: any) {
            if (data.pmid === display) {
              jQuery('.hover-box').html('<strong>' + data.author + ' (' + data.year + ')</strong><br />' + data.title);
            }
          };
          let body = JSON.stringify({
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          display = item.display.substr(0, item.display.indexOf(' '));
          scope._http.post(globals.backendURL + '/efetch', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedMetadata(data),
              err => console.log(err),
              () => console.log('Got metadata')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.add-bar').hide();
    jQuery(document).on('mousemove', function(e: any){
      jQuery('.hover-box').css({
        left:   e.clientX - 320,
        bottom: window.innerHeight - e.clientY
      });
    });
  }
  setObserved(phenotypeID: number, observed: boolean) {
    let scope = this;
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].observed = data.observed;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'observed': observed
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/observed', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set observed')
      );
  }
  setFrequency(phenotypeID: number, frequency: number) {
    let scope = this;
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].frequency = data.frequency;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'frequency': frequency
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/frequency', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set frequency')
      );
  }
  setOnset(phenotypeID: number, onset: string) {
    let scope = this;
    let finishSetOnset = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].onset = data.onset;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'onset': onset
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/onset', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetOnset(data),
        err => console.log(err),
        () => console.log('Finish set onset')
      );
  }
  removePhenotype(phenotypeID: number) {
    let scope = this;
    let finishRemovePhenotype = function(data: any) {
      scope.gotoAnnotation(localStorage.getItem('uaAnnotation'), document.documentElement.scrollTop || document.body.scrollTop);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemovePhenotype(data),
        err => console.log(err),
        () => console.log('Finish remove phenotype')
      );
  }
  removeRef(refID: number) {
    let scope = this;
    let finishRemoveRef = function(data: any) {
      scope.gotoAnnotation(localStorage.getItem('uaAnnotation'), document.documentElement.scrollTop || document.body.scrollTop);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'refID': refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/ref/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveRef(data),
        err => console.log(err),
        () => console.log('Finish remove ref')
      );
  }
  removeCitation(phenotypeID: number, refID: number) {
    let scope = this;
    let finishRemoveCitation = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === phenotypeID) {
          for (let j = 0; j < scope.annotation.phenotypes[i].citations.length; j++) {
            if (scope.annotation.phenotypes[i].citations[j].refID === refID)
              scope.annotation.phenotypes[i].citations.splice(j, 1);
          }
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'refID': refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/citation/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveCitation(data),
        err => console.log(err),
        () => console.log('Finish remove citation')
      );
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    localStorage.setItem('uaPhenositoryDisease', diseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  copyToClipboard(string: string) {
    window.prompt('Copy to clipboard: Ctrl+C or Cmd+C', string);
  }
  publishAnnotation() {
    let scope = this;
    this.alerts = [];
    let finishPublish = function (data: any) {
      if (data.success) {
        scope.annotation.status = 2;
      } else if (data.uncitedPhenotypes) {
        scope.markUncitedPhenotypes = true;
        this.alerts.push({
          type: 'danger',
          msg: 'Please cite the phenotypes marked with (!).',
          closable: true
        });
      } else if (data.refs.length > 0) {
        this.alerts.push({
          type: 'danger',
          msg: 'Please assign or remove unused reference(s): ' + data.refs.toString(),
          closable: true
        });
      } else {
        this.alerts.push({
          type: 'danger',
          msg: 'You must have added at least one phenotype.',
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/publish', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishPublish(data),
        err => console.log(err),
        () => console.log('Published (or not)')
      );
  }
}
