let fs = require('fs');






/**
 * Remove trailing white space
 */
Buffer.prototype.strip = function(){
  let i=this.length-1;

  while (this[i] === 0){
    i--;
  }

  return this.slice(0,i+1);
}
/**
 * Replace a section of buffer with another buffer
 * @param {Buffer} buff 
 * @param {Number=} offset 
 * @param {Number=} length 
 */
Buffer.prototype.replace = function(buff, offset=0, length=NaN){
  if (isNaN(length)){
    length = buff.length;
  }

  for (let i=0; i<length; i++){
    this[i+offset] = buff[i];
  }

  return this;
}











class Attribute{
  /**
   * 
   * @param {Table} parent 
   * @param {string} name 
   * @param {string} type 
   * @param {number} size In Bytes
   */
  constructor(parent, name, type, pos, size){
    if (!(parent) instanceof Entity){
      throw new Error('Invalid Attribute definition');
    }

    this.parent = parent;
    this.name = name;
    this.type = type;
    this.position = pos;

    //Generate types
    switch(type){
      case 'int':
        switch(size){
          case 1:
            this.type = 'int8';
            this.size = 1;
            break;
          case 2:
            this.type = 'int16';
            this.size = 2;
            break;
          case 4:
            this.type = 'int32';
            this.size = 4;
            break;
          case 8:
            this.type = 'int64';
            this.size = 8;
            break;
          default:
            throw new Error(`Invalid int size (${size}). Must be either; 1, 2, 4, 8`);
        }
        break;
      case 'uint':

        switch(size){
          case 1:
            this.type = 'uint8';
            this.size = 1;
            break;
          case 2:
            this.type = 'uint16';
            this.size = 2;
            break;
          case 4:
            this.type = 'uint32';
            this.size = 4;
            break;
          case 6:
            this.type = 'uint';
            this.size = 6;
            break;
          default:
            throw new Error(`Invalid uInt size (${size}). Must be either; 1, 2, 4, 6`);
        }
        
        break;
      case 'double':
        this.type = 'double';
        this.size = 8;
        break;
      case 'float':
        this.type = 'float';
        this.size = 4;
        break;
      case 'string':
        this.type = 'string';
        this.size = size;
        break;
      case 'boolean':
        this.type = 'boolean';
        this.size = 1;
      default:
        throw new Error(`Invalid Attribute type ${type}`);
    }
  }

  /**
   * Encode the data to a buffer according to Attribute's type
   * @param {any} data 
   */
  encode(data){
    let buff = new Buffer(this.size);
  
    switch(this.type){
      case 'double':
        buff.writeDoubleLE(data, 0, this.size);
        break;
      case 'float':
        buff.writeDoubleLE(data, 0, this.size);
        break;
      case 'boolean':
        if (data === true){
          buff.write(255, 0, 1);
        }else{
          buff.write(0, 0, 1);
        }
        break;
      case 'string':
        buff.write(data, 0, this.size);
        break;
      case 'int8':
        buff.writeInt8(data, 0, this.size);
        break;
      case 'int16':
        buff.writeInt16LE(data, 0, this.size);
        break;
      case 'int32':
        buff.writeInt32LE(data, 0, this.size);
        break;
      case 'int64':
        buff.writeIntLE(data, 0, this.size);
        break;
      case 'uint8':
        buff.writeUInt8(data, 0, this.size);
        break;
      case 'uint16':
        buff.writeUInt16LE(data, 0, this.size);
        break;
      case 'uint32':
        buff.writeUInt32LE(data, 0, this.size);
        break;
      case 'uint':
        buff.writeUIntLE(data, 0, this.size);
        break;
    }
  
    return buff;
  }

  /**
   * Decode the buffer to the set type
   * @param {Buffer} buff 
   */
  decode(buff){
    let data;
  
    switch(this.type){
      case 'double':
        data = buff.readDoubleLE();
        break;
      case 'float':
        data = buff.readDoubleLE();
        break;
      case 'string':
        data = buff.strip().toString();
        break;
      case 'boolean':
        if (buff[0] === 0){
          data = false;
        }else{
          data = true;
        }
        break;
      case 'int8':
        data = buff.readInt8();
        break;
      case 'int16':
        data = buff.readInt16LE();
        break;
      case 'int32':
        data = buff.readInt32LE();
        break;
      case 'int64':
        data = buff.readIntLE();
        break;
      case 'uint8':
        data = buff.readUInt8();
        break;
      case 'uint16':
        data = buff.readUInt16LE();
        break;
      case 'uint32':
        data = buff.readUInt32LE();
        break;
      case 'uint64':
        data = buff.readUIntLE();
        break;
    }
  
    return data;
  }
}





class Tuple{
  constructor(parent, data){
    if (!(parent) instanceof Entity){
      throw new Error('Invalid Tuple definition');
    }

    this.parent = parent;
    this.buffer = data;
    this.data = {};
    this.empty = true;
    this.index = -1;

    if (!data){
      this.erase();
      return this;
    }else if (data.length != this.parent.tupleLength){
      throw new Error(`Tuple was given a bad row. Expected ${this.parent.tupleLength} got ${data.length}`);
    }

    this._checkEmpty();
    return this;
  }

  /**
   * Make all of the tupe's data default values
   */
  erase(){
    this.buffer = new Buffer(this.parent.tupleLength);
    this.empty = true;

    for (let field of this.parent.fields){
      if (field.type == "string"){
        this.data[field.name] = '';
      }else if (field.type == "boolean"){
        this.data[field.name] = false;
      }else{
        this.data[field.name] = 0;
      }
    }

    return this;
  }

  /**
   * See if the tuple has any non-default values
   */
  _checkEmpty(){
    this.empty = true;

    for (let i=0; i<this.buffer.length; i++){

      if (this.buffer[i] != 0){
        this.empty = false;
        break;
      }
    }

    return this;
  }

  /**
   * Encode local cache into buffer
   */
  encode(){
    let i=0;

    for (let attr of this.parent.fields){

      // If the data has not been decoded leave the tuple it's the data in it's buffer
      if (this.data[attr.name] === undefined){
        continue;
      }

      let enc = attr.encode(this.data[attr.name]);
      this.buffer.replace(enc, attr.position);
    }

    return this;
  };
  /**
   * Decode buffer data, into data cache
   * @param {String=} field if set, then it will only decode that field
   */
  decode(field){
    let i=0;

    if (field instanceof String){
      for (let attr of this.parent.fields){
        if (attr.name == field){
          this.data[attr.name] = attr.decode(this.buffer.slice(attr.position, attr.position+attr.size));;
        }
      }
    }else{ //Decode all fields
      for (let attr of this.parent.fields){        
        this.data[attr.name] = attr.decode(this.buffer.slice(attr.position, attr.position+attr.size));
      }
    }

    return this;
  };
}





class Entity{
  constructor(name){
    this.name = name;

    this.fields = [];
    this.tupleLength = 0;
    this.empty = [];
    this.rows = 0;
  }

  /**
   * Define a new attribute
   * @param {String} name 
   * @param {String} type 
   * @param {Number} size 
   */
  define(name, type, size){
    let a = new Attribute(this, name, type, this.tupleLength, size);
    this.fields.push(a);
    this.tupleLength += a.size;
  
    return this;
  }

  /**
   * Make a new tuple in context to this Trove/Table
   * @param {Buffer} data 
   */
  tuple(data){
    return new Tuple(this, data);
  }
}





class Table extends Entity{
  constructor(name, path){
    super();

    if (!fs.existsSync(path)){
      throw new Error(`Invalid database path given to ${name} (${path})`);
    }
    
    this.path = path;
  }

  /**
   * Loops though each row returning the relavent tuple and row index number
   * @param {function} loop 
   * @param {function=} finish 
   * @returns {void}
   */
  forEach(loop, finish){}

  /**
   * Get a specific tuple acording to row index
   * @param {number} index 
   */
  get(index){
    if (index > this.rows){
      throw new Error('Invalid Index');
    }

    //TODO
  }

  /**
   * Looks though each row finding blank tuples as well as the current length of the table
   */
  scan(){
    //TODO
  }

  /**
   * Overwrite a specific row index with the tuple's data
   * @param {number} index 
   * @param {Tuple} tuple 
   */
  overwrite(index, tuple){
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    if (index > this.rows){
      throw new Error('Invalid Index');
    }
    //TODO
  }

  /**
   * Make a specific row index blank
   * @param {number} index 
   */
  delete(index){
    if (index > this.rows){
      throw new Error('Invalid Index');
    }

    //TODO
  }

  /**
   * Append a tuple to the end of the Table
   * @param {Tuple} tuple 
   */
  append(tuple){
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    //TODO
  }

  /**
   * Write the tuple to either a blank row or the end of the table
   * @param {Tuple} tuple 
   */
  insert(tuple){
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    //TODO
  }

  async compact(){
    console.info('Compacting a table stored as a file is not necessary since new data will just fill in blank rows.');
    console.info('\tAlso it can cause conflict errors due to the use of async functions for the file system to increase speed');

    return true;
  }
}





/**
 * Behaves like a Table, but stores it's data in RAM.
 * This can be useful for compiling multiple tables into one file
 */
class Trove extends Entity{
  constructor(name){
    super();

    this.store = new Buffer([]);
  }

  /**
   * Loop though every tuple in the store
   * @param {function} loop Callback
   * @param {function=} finish Callback. Optional
   */
  forEach(loop, finish){
    let i=0;
    let s = 0;
    let e = this.tupleLength;

    while (e < this.store.length){
      let t = this.tuple(this.store.slice(s, e));
      t.index = i;

      loop(i, t);

      i += 1;
      s = e;
      e += this.tupleLength;
    }

    if (typeof finish == 'function'){
      finish(i);
    }
  }

  /**
   * Get a tuple by index number
   * @param {number} index 
   * @returns {Promise}
   */
  async get(index){
    if (index > this.rows){
      return null;
    }

    let s = index*this.tupleLength;
    let e = s + this.tupleLength;
    let t = this.tuple(this.store.slice(s, e));
    t.index = i;

    return t;
  }

  /**
   * Finds empty rows in the table for data to be inserted into
   * @returns {Promise}
   */
  scan(){
    let db = this;

    return new Promise((resolve, reject)=>{
      db.empty = [];
      let count = 0;

      db.forEach((index, tuple)=>{
        if (tuple.empty){
          this.empty.push(index);
        }
        count += 1;
      }, ()=>{
        db.rows = count;
        resolve();
      });
    });
  }

  /**
   * Overwrite a specific row with the tuple's data
   * @param {number} index 
   * @param {Tuple} tuple 
   */
  async overwrite(index, tuple){
    if (index > this.rows){
      return false;
    }
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    tuple.encode();
    this.store.replace(tuple.buffer, index*this.tupleLength);

    return true;
  }

  /**
   * Make the given row empty
   * @param {number} index 
   * @returns {Promise}
   */
  async delete(index){
    if (index > this.rows){
      return false;
    }

    if (this.empty.indexOf(index) != -1){
      return true;
    }

    this.store.replace(this.tuple().buffer, index*this.tupleLength);
    this.empty.push(index);

    return true;
  }

  /**
   * Write the tuple to the end of the store
   * @param {Tuple} tuple 
   * @returns {Promise}
   */
  async append(tuple){
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    this.rows += 1;
    tuple.encode();

    this.store = Buffer.concat([this.store, tuple.buffer]);

    return true;
  }

  /**
   * Either fill an empty row, or write to the end of the store
   * @param {Tuple} tuple 
   * @returns {Promise}
   */
  async insert(tuple){
    if (!(tuple instanceof Tuple)){
      throw new Error('Invalid Tuple');
      return null;
    }

    if (this.empty.length != 0){
      return this.overwrite(
        this.empty.splice(0)[0],
        tuple
      );
    }

    this.append(tuple);
    return this.rows;
  }

  /**
   * Remove any empty rows
   * @returns {Promise}
   */
  compact(){
    let db = this;

    return new Promise((resolve)=>{
      db.scan()
        .then(()=>{
          let cache = new Buffer(db.store.length-(db.empty.length*db.tupleLength));
          let ptrWrite = 0;
          let count = 0;

          for (let i=0; i<db.rows; i++){
            if (db.empty.indexOf(i) == -1){
              let s = i*this.tupleLength;
              let e = s + this.tupleLength;

              cache.replace(db.store.slice(s, e), ptrWrite);
              ptrWrite += this.tupleLength;
              count += 1;
            }
          }

          this.empty = [];
          this.rows = count;
          this.store = cache;

          resolve();
        })
        .catch((e)=>{
          throw e;
        });
    })
  }
}










module.exports = {
  Table,
  Trove
};