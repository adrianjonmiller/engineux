import flow from './flow.json';
import Machine from '../src'

const machine = new Machine(flow, '_3nanqoc');
machine.start();

test('Get current state', () => {
  expect(machine.getState()).toBe('_3nanqoc');
});

test('Get state events', () => {
  expect(machine.getEvents().length).toBe(2);
});

test('Emit event', () => {
  expect(machine.emit(0).getState()).toBe('_6kplw0k');
});

test('Get previous event', () => {
  expect(machine.getPrevState()).toBe('_3nanqoc');
});

test('Go to previous state', () => {
  expect(machine.back().getState()).toBe('_3nanqoc');
});

test('On state change', (done) => {
  machine.onStateChange((_) => {
    done();
  })
  machine.emit(0)
});