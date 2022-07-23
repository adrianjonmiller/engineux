import Machine from '../src'

const flow = {
  'default': {
    data: {
      test: 'test'
    },
    on: {
      submit: {
        next: 'loading'
      },
    }
  },
  'loading': {
    data: {},
    on: {
      success: {
        next: 'success',
        listener: ({next}) => next()
      },
      failure: {next: 'failure'},
    }
  },
  'success': {
    extend: 'default'
  },
  'error': {
    data: {},
    on: {
      submit: {next: 'loading'},
    }
  }
};

let machine;

test('Machine started', (done) => {
  machine = new Machine(flow, 'default', () => {
    done();
  });

  machine.start();
})

test('Get current state', () => {
  expect(machine.getState()).toBe('default');
});

test('Get state events', () => {
  expect(machine.getEvents().length).toBe(1);
});

test('Emit event', () => {
  expect(machine.emit('submit').getState()).toBe('loading');
});

test('Get previous event', () => {
  expect(machine.getPrevState()).toBe('default');
});

test('Go to previous state', () => {
  expect(machine.back().getState()).toBe('default');
});

test('On state change', (done) => {
  machine.onStateChange((_) => {
    done();
  });
  machine.emit('submit')
});

test('Call listener', () => {
  machine.emit('success');
  expect(machine.getState()).toBe('success');
});

test('Extend', () => {
  expect(machine.getData().test).toBe('test');
});