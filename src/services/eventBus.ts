import EventEmitter from 'eventemitter3';

const emitter = new EventEmitter();

const eventBus = {
  on: emitter.on.bind(emitter),
  off: emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter),
  listeners: emitter.listeners.bind(emitter),

  debug(eventName: string) {
    console.log(
      `[EventBus] '${eventName}' listener count:`,
      emitter.listeners(eventName).length
    );
  }
};

export default eventBus;
