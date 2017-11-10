const expect = require("chai").expect;
const chai = require('chai');
const WebSocketUtils = require("../WebSocketUtils");
const sinon = require("sinon");
const assert = require("assert");
const sinonChai = require('sinon-chai');

chai.use(sinonChai);


const initialize = WebSocketUtils.initialize;
const id = 'api:syncActivities';
const data = "inputData";

const socket = {
    request : {
        user : {
            logged_in : true
        }
    },
    dataMap:{},
    on: function(id, fn) {
        this.dataMap[id] = fn;
    },
    triggerOn: function(id) {
        this.dataMap[id]();
},
    emit : function(id, response){
        return response;
    }
};

describe("testing WebSocketUtils", function(){
    it("should call the function from the required file", function(done){
        const model = {
            methodName : function(userData, data){
                const response = {
                    success: true,
                    data: "responseData",
                    responseTime: 100,
                    status : {code : 200} 
                };
                return response;
            }
        };
        
        const spy = sinon.spy(WebSocketUtils, "initialize");
        WebSocketUtils.initialize(socket, id, model, model.methodName());
        spy.restore();
        done();
    });
});

describe("testing function socket.on", function(){
    it("socket.on should have been called once", function(done){
        const model = {
            methodName : function(userData, data){
            }
        };
        
        const spy = sinon.spy(socket, "on");
        WebSocketUtils.initialize(socket, id, model, "methodName");
        assert(spy.called);
        spy.restore();
        done();
    });
});

describe("testing function model[methodName]", function(){
        const response = {
            success: true,
            data: "responseData",
            responseTime: 100,
            status : {code : 200} 
        };
        const ActivityModel = {
            syncActivities :  function(userData, data) {
                return new Promise((resolve, reject) => {
                    resolve(response);
                })
            }
        }
        const spy = sinon.spy(ActivityModel, "syncActivities");
        WebSocketUtils.initialize(socket, 'api:syncActivities', ActivityModel, 'syncActivities');
        socket.triggerOn('api:syncActivities')
       
        it('it should have called model[methodName] and returned response', function(done){
            expect(spy).to.have.been.calledOnce;
            done();
        });

        it('should have called model[methodName] with logged status', function(done){
            expect(spy).to.have.been.calledWith({
                logged_in : true
            });
            done();
        });

        spy.restore();
});

describe("testing if the socket emits the data", function(){
        const response = {
            success: true,
            data: "responseData",
            responseTime: 100,
            status : {code : 200} 
        };
        const ActivtiyModel = {
            syncActivities : function(userData, data){
                return new Promise((resolve) => {
                    resolve(response);
                });
            }
        };
        const spy = sinon.spy(socket, "emit");
        WebSocketUtils.initialize(socket, 'api:syncActivities', ActivtiyModel, 'syncActivities');
        socket.triggerOn('api:syncActivities')

        it("socket.emit should have been called once", function(done){
            done().then(()=>{
                expect(spy).to.have.been.called;
            })
        });

        it("socket.emit should returned response", function(done){
            done().then(()=>{
                expect(spy).to.have.been.returned(response);
            })
    });
    spy.restore();
});

describe("testing if the socket fails to emit data", function(){
    const error = {
        success: false,
        data: "responseData",
        responseTime: 100,
        status : {code : 500} 
    };

        const ActivityModel = {
            syncActivities : function(userData, data){
                return new Promise((reject) => {
                    reject(error);
                });
            }
        };

        const spy = sinon.spy(socket, "emit");
        WebSocketUtils.initialize(socket, 'api:syncActivities', ActivityModel, 'syncActivities');
        socket.triggerOn('api:syncActivities')

        it("socket.emit should have been called once", function(done){
        done().then(()=>{
            expect(spy).to.have.returned(error)
        });
    });
    spy.restore();
});

describe("testing the case user logged out case", function(){
        
        
        const loggedOut = {
            success: false,
            data: false,
            responseTime: 0,
            status : {code : 403,
            message : 'Unauthorized'
            } 
        };
    

        const ActivityModel = {
            syncActivities : function(userData, data){
                return new Promise((reject) => {
                    reject(error);
                });
            }
        };

        const spy = sinon.spy(socket, "emit");
        WebSocketUtils.initialize(socket, 'api:syncActivities', ActivityModel, 'syncActivities');
        socket.triggerOn('api:syncActivities')

        it("socket.emit should have called with the logged out case", function(done){
            done().then(()=>{
                expect(spy).to.have.been.calledWith(
                    {
                        logged_in : false
                    })
            });
        });
        it("socket.emit should have been called once", function(done){
        done().then(()=>{
            socket.request.user.logged_in = false;
            expect(spy).to.have.returned(loggedOut)
        });
    });
    spy.restore();
    
});