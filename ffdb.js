import { truncate } from 'fs';

let fs = require('fs');
String.prototype.strip = function(){
  let i=this.length-1;

  while (this[i] === ' '){
    i--;
  }

  return this.slice(0,i);
}




//TODO add boolean type
class Attribute{
  /**
   * 
   * @param {Table} parent 
   * @param {string} name 
   * @param {string} type 
   * @param {number} size In Bytes
   */
  constructor(parent, name, type, size){
    if (!(parent instanceof Table)){
      throw new Error('Invalid Attribute parent');
    }

    this.parent = parent;
    this.name = name;
    this.type = type;

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
        data = buff.toString();
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
    this.parent = parent;
    this.buffer = data;
    this.data = {};
    this.empty = true;

    if (!data){
      this.erase();
      return this;
    }else if (data.length != this.parent.tupleLength){
      throw new Error(`Tuple was given a bad row. Expected ${this.parent.tupleLength} got ${data.length}`);
    }

    this._checkEmpty();
    return this;
  }

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

  encode(){};
  decode(){};
}


class Table{
  constructor(name, path){
    if (!fs.existsSync(path)){
      throw new Error(`Invalid database path given to ${name} (${path})`);
    }

    this.name = name;
    this.path = path;

    this.fields = [];
    this.tupleLength = 0;
  }

  define(name, type, size){
    this.fields.push(new Attribute(this, name, type, size));
    this.tupleLength += size;
  
    return this;
  }

  tuple(data){
    return new Tuple(this, data);
  }
}


module.exports = Table;