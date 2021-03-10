import Store from 'storeux';

function attempt (fn) {
  try {
    return fn()
  } catch (err) {
    console.error(err)
  }
}

export default class {
  constructor (...args) {
    this.store = new Store(args[0] || {});
    this.currentState = null;
    this.started = false;
    this.history = [];
    this.beforeGuard = null;
    this.payload = null;
    this.stateListener = null;
    this.startState = null;

    if (args.length === 2) {
      this.stateListener = typeof args[1] === 'function' ? args[1] : null;
      this.startState = typeof args[1] === 'string' ? args[1] : null;
    }

    if (args.length === 3) {
      this.startState = typeof args[1] === 'string' ? args[1] : null;
      this.stateListener = typeof args[2] === 'function' ? args[2] : null;
    }

    this.methods = (ctx) => ({
      getState: () =>  this.getState.call(ctx),
      getData: () =>  this.getData.call(ctx),
      getEvents: () =>  this.getEvents.call(ctx),
      getPrevState: () => this.getPrevState.call(ctx),
      back: () => this.back.call(ctx),
      emit: (event, payload) =>  this.emit.call(ctx, event, payload)
    });

    return {
      ...this.methods(this),
      start: (state) => this.start.call(this, state),
      beforeEach: (fn) => this.beforeEach.call(this, fn),
      onStateChange: (fn) => this.setStateListener.call(this, fn)
    }
  }

  start (startState) {
    this.startState = startState || this.startState;

    return attempt(() => {
      if (this.started) {
        console.log('Machine is already running');
      }

      if (!this.startState) {
        throw `No start state is defined`
      }

      const store = this.store.get();
      
      if (!(this.startState in store)) {
        throw `${startState} does not exist in flow`
      }

      this.started = true;
      return this.setState(this.startState)
    });
  }

  setStateListener (fn) {
    return attempt(() => {
      if (!(typeof fn === 'function')) {
        throw `State listener must be a function`
      }

      this.stateListener = fn;
      return this.methods(this)
    })
  }

  getState () {
    return attempt(() => {
      if (!this.started) {
        throw `Machine has not been started`
      }

      return this.currentState
    })
  }

  getName () {
    return attempt(() => this.store.get(`${this.currentState}.name`))
  }

  getMeta () {
    return attempt(() => this.store.get(`${this.currentState}.meta`))
  }

  getData () {
    return attempt(() => this.store.get(`${this.currentState}.data`))
  }

  getEvents () {
    return attempt(() => this.store.get(`${this.currentState}.on`))
  }

  getPrevState () {
    return this.history.length ? this.history[this.history.length - 1] : null;
  }

  back () {
    return attempt(() => {
      if (this.history.length === 0) {
        return
      }

      const previousState = this.history.pop();

      return this.setState(previousState, false);
    })
  }

  try(ref, payload) {
    const event = this.store.get(`${this.currentState}.on.${ref}`);
    if (!event) {
      return
    }
    this.emit(ref), payload
  }

  emit (ref, payload) {
    return attempt(() => {
      const event = this.store.get(`${this.currentState}.on.${ref}`);
      
      if (!event) {
        throw `${event} does not exist in state ${this.currentState}`
      }

      const nextState = 'next' in event ? event.next : null;

      if (nextState === this.currentState) {
        return 
      }

      if (this.beforeGuard) {
        this.beforeGuard.call({}, this.methods(this), nextState, this.currentState, (redirect) => this.newState(redirect || nextState));
        return this.methods(this);
      }

      const leave = this.store.get(`${this.currentState}.leave`);

      if (leave && typeof leave === 'function') {
        leave.call({}, this.methods(this), nextState, this.currentState)
      }

      return this.setState(nextState, payload)
    })
  }

  setState(nextState, payload, forward = true) {
    return attempt(() => {
      const state = this.store.get(nextState);

      if (!state) {
        throw `${nextState} does not exists in states`
      }

      let prevState = this.currentState;

      if (forward) {
        this.history.push(prevState);
      } else {
        prevState = this.history.length ? this.history[this.history.length - 1] : null
      }

      this.currentState = nextState;

      const enter = this.store.get(`${this.currentState}.enter`);

      if (enter && typeof enter === 'function') {
        enter.call({}, this.methods(this), nextState, prevState, payload)
      }

      if (this.stateListener && typeof this.stateListener === 'function') {
        this.stateListener({
          back: () => this.back.call(this),
          emit: (event, payload) =>  this.emit.call(this, event, payload),
          on: this.getEvents(),
          data: this.getData(),
          state: this.currentState,
          prev: prevState,
          name: this.getName(),
          meta: this.getMeta()
        },
        payload)
      }
      return this.methods(this);
    })
  }

  beforeEach(cb) {
    attempt(() => {
      if (!(typeof cb === 'function')) {
        throw `Before each must be a function`
      }

      this.beforeGuard = cb;
      return this.methods(this)
    })
  }
}