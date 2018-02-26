  let fs = require('fs');

  class Attribute{
    constructor(parent, name, typeString, size){
      this.parent = parent;
      this.name = name;
      this.type = null;
      this.size = 0;

      this.ref = null;

      // Make this attribute into a reference if valid
      if (typeString[0] == '#'){
        typeString = typeString.slice(1);

        // Check the reference is valid
        if (!this.parent.links[typeString]){
          throw new ReferenceError(`Invalid Table link "${typeString}"`);
        }

        this.ref = this.parent.links[typeString];
        typeString = 'reference';
      }

      //Parse the size for custom string/blob lengths
      this.build(typeString, size);
    }

    build(typeString, size){
      switch(typeString){
        case 'int8':
          this.type = this.TYPE.INT;
          this.size = 1;
          break;
        case 'int16':
          this.type = this.TYPE.INT;
          this.size = 2;
          break;
        case 'int32':
          this.type = this.TYPE.INT;
          this.size = 4;
          break;
        case 'int64':
          this.type = this.TYPE.INT;
          this.size = 8;
          break;
        case 'uint8':
          this.type = this.TYPE.UINT;
          this.size = 1;
          break;
        case 'uint16':
          this.type = this.TYPE.UINT;
          this.size = 2;
          break;
        case 'uint32':
          this.type = this.TYPE.UINT;
          this.size = 4;
          break;
        case 'uint64':
          this.type = this.TYPE.UINT;
          this.size = 8;
          break;
        case 'float':
          this.type = this.TYPE.FLOAT;
          this.size = 4;
          break;
        case 'double':
          this.type = this.TYPE.DOUBLE;
          this.size = 8;
          break;
        case 'string':
          this.type = this.TYPE.STRING;
          this.size = size;
          break;
        case 'blob':
          this.type = this.TYPE.BLOB;
          this.size = size;
          break;
        case 'reference':
          this.type = this.TYPE.REFERENCE;
          this.size = 8;
          break;
        default:
          throw new TypeError(`Invalid type ${typeString}`);
          break;
      }
    }

    /**
     * Encode the data into a buffer
     * @param {*} data 
     */
    encode(data){
      let buff = Buffer(this.size);

      switch(this.type){
        case this.TYPE.INT:
          switch (this.size){
            case 1:
              buff.writeInt8(data, 0, 1);
              break;
            case 2:
              buff.writeInt16LE(data, 0, 2);
              break;
            case 4:
              buff.writeInt32LE(data, 0, 4);
              break;
            case 8:
              buff.writeIntLE(data, 0, 8);
              break;
            default:
              throw new TypeError(`Invalid Int size ${this.size}`);
          }

          break;
        case this.TYPE.UINT:
          switch (this.size){
            case 1:
              buff.writeUInt8(data, 0, 1);
              break;
            case 2:
              buff.writeUInt16LE(data, 0, 2);
              break;
            case 4:
              buff.writeUInt32LE(data, 0, 4);
              break;
            case 8:
              buff.writeUIntLE(data, 0, 8);
              break;
            default:
              throw new TypeError(`Invalid UInt size ${this.size}`);
          }

          break;
        case this.TYPE.FLOAT:
          buff.writeFloatLE(data, 0, 4);
          break;
        case this.TYPE.DOUBLE:
          buff.writeDoubeLE(data, 0, 4);
          break;
        case this.TYPE.STRING:
          buff.write(data, 0, this.size);
          break;
        case this.TYPE.BUFFER:
          buff.write(data, 0, this.size);
          break;
        case this.TYPE.REFERENCE:
          buff = buff.writeUIntLE(data, 0, 8);
        default:
          throw new TypeError(`Invalid Type ${this.type}`);
      }

      return buff;
    }

    /**
     * Decode the given buffer according to this attribute
     * @param {Buffer} buff 
     */
    decode(buff){
      let data;

      switch(this.type){
        case this.TYPE.INT:
          switch (this.size){
            case 1:
              data = buff.readInt8(data, 0, 1);
              break;
            case 2:
              data = buff.readInt16LE(data, 0, 2);
              break;
            case 4:
              data = buff.readInt32LE(data, 0, 4);
              break;
            case 8:
              data = buff.readIntLE(data, 0, 8);
              break;
            default:
              throw new TypeError(`Invalid Int size ${this.size}`);
          }

          break;
        case this.TYPE.UINT:
          switch (this.size){
            case 1:
              data = buff.readUInt8(data, 0, 1);
              break;
            case 2:
              data = buff.readUInt16LE(data, 0, 2);
              break;
            case 4:
              data = buff.readUInt32LE(data, 0, 4);
              break;
            case 8:
              data = buff.readUIntLE(data, 0, 8);
              break;
            default:
              throw new TypeError(`Invalid UInt size ${this.size}`);
          }

          break;
        case this.TYPE.FLOAT:
          data = buff.readFloatLE(data, 0, 4);
          break;
        case this.TYPE.DOUBLE:
          data = buff.readDoubeLE(data, 0, 4);
          break;
        case this.TYPE.STRING:

          //Remove trailing characters
          let i=0;
          search: for (i=buff.length-1; i>=0; i--){
            if (buff[i] != 0){
              i ++;
              break search;
            }
          }

          data = buff.slice(0, i).toString();
          break;
        case this.TYPE.BUFFER:
          data = buff.slice(0, this.size);
          break;
        case this.TYPE.REFERENCE:
          data = buff.readUIntLE(data, 0, 8);
        default:
          throw new TypeError(`Invalid Type ${this.type}`);
      }

      return data;
    }
  }
  Attribute.prototype.TYPE = {
    INT: 0,
    UINT: 1,
    FLOAT: 2,
    DOUBLE: 3,
    STRING: 4,
    BUFFER: 5,
    REFERENCE: 6
  }




  class Tuple{
    constructor(parent, buffer, index=-1){
      this.parent = parent;
      this.index = index;
      this.data = {};

      if (buffer instanceof Buffer){
        this.decode(buffer);
      }
    }

    encode(){
      let buff = Buffer(this.parent.size);
      let offset = 0;
      for (let attr of this.parent.attr){
        let nx = offset+attr.size;
        buff = Buffer.concat([buff.slice(0, offset), attr.encode(this.data[attr.name]), buff.slice(nx)], buff.size);

        offset = nx;
      }

      return buff;
    }

    decode(buffer){
      let offset = 0;
      let nx = 0;

      for (let attr of this.parent.attr){
        nx = offset+attr.size;
        this.data[attr.name] = attr.decode(buffer.slice(offset, nx));

        // This attribute is a reference
        if (attr.ref){
          throw Error('Unimplemented');

          // Create a function to complete the reference
          let index = this.data[attr.name];
          this.data[attr.name] = async ()=>{
            return ( await attr.ref.get(this.data[attr.name]) );
          }
          this.data[attr.name].index = index;
        }

        offset = nx;
      }

      return this;
    }
  }






  class Table{
    constructor(name, path){
      this.name = name;
      this.rows = 0;
      this.size = 0;
      this.attr = [];
      this.links = {};

      this.empty = [];

      this.path = path;
    }

    /**
     * Add a field to this table
     * @param {string} name 
     * @param {string} type 
     * @param {number=} sizes
     */
    field(name, type, size){
      this.attr.push(new Attribute(this, name, type, size))
    }

    /**
     * Link the table to this one for references
     * @param {Table} other 
     */
    link(other){
      if (!(other instanceof Table)){
        throw new TypeError(`Invalid Table "${other}"`);
      }

      this.links[other.name] = other;
    }

    /**
     * Get the tuple size
     * Lock down the attributes & table links
    */
    build(){
      return new Promise((res,rej)=>{
        this.size = 0;
        for (let attribute of this.attr){
          this.size += attribute.size;
        }

        let stat = fs.lstatSync(this.path);
        if (stat.size % this.size != 0){
          throw new Error(`"${this.path}" is not of a valid length`);
        }else{
          this.rows = stat.size / this.size;
        }

        // Find empty rows
        let i = 0;
        let s = fs.createReadStream(this.path, {
          start: 0,
          highWaterMark: this.size,
          end: stat.size
        })
        s.on('data', (c)=>{

          // Are all bytes in the tuple = 0?
          let empty = true;
          scan: for (let j=0; j<c.length; j++){
            if (c[j] != 0){
              empty = false;
              break scan;
            }
          }

          if (empty){
            this.empty.push(i);
          }
          i++;
        });
        s.on('end', ()=>{
          this.rows = i;
          res();
          s.close();
        });
      });

      // Don't ever let these change duiring operation
      Object.freeze(this.field);
      Object.freeze(this.link);
    }



    /**
     * Get the tuple at this index
     * @param {Number} index 
     */
    get(index){
      return new Promise((res, rej)=>{
        if (index > this.rows){
          throw new ReferenceError(`${this.name}: Index out of range ${index}>${this.rows}`);
        }

        let start = index*this.size;
        let hit = false;
        let s = fs.createReadStream(this.path, {
          start: start,
          highWaterMark: this.size
        });
        s.on('data', (c)=>{
          res(new Tuple(this, c, index));
          s.close();
          hit = true;
        });
        s.on('end', ()=>{
          console.log('hit?', hit, start);
        })
      });
    }

    /**
     * Write over the stored tuple with this tuple
     * @param {Number} index 
     * @param {Tuple} tuple 
     */
    set(index, tuple){
      return new Promise((res, rej)=>{
        if (!(tuple instanceof Tuple)){
          throw new TypeError('Invalid tuple data', tuple);
        }

        let buff = tuple.encode();

        // Is this data an empty row?
        let empty = true;
        for (let i=0; i<buff.length; i++){
          if (buff[i] != 0){
            empty = false;
            break;
          }
        }

        // If this row was empty, make it not empty anymore
        if (!empty){
          let i = this.empty.indexOf(index)
          if (i != -1){
            this.empty.splice(i, 1);
          }
        }


        if (index > this.rows){
          let extra = index - this.rows;                         //How many blank rows are needed before this row
          buff = Buffer.concat([Buffer(extra*this.size), buff]); // Add the required blank tuples before this one

          // Tell the system that these new empty rows exist
          for (let i=0; i<=extra; i++){
            this.empty.push(i+index);
          }

          fs.appendFile(this.path, buff, res);
        }else{
          let start = index*this.size;
          let end = start + this.size;

          let s = fs.createWriteStream(this.path, {
            start, end
          });
          s.write(buff);
          s.close();
          res();
        }
      });
    }

    /**
     * Create a tuple owned by this table
     * @param {Buffer} buffer 
     */
    tuple(buffer, index=-1){
      return new Tuple(this, buffer, index);
    }
  }





  module.exports = Table;