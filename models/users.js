const Sequelize = require('sequelize');

const sequelize = new Sequelize('[add credentials here', 'add credentials here', 'add credentials here', {
	host: 'add credentials here',
	port: 'add credentials here',
	dialect: 'mysql',
	//dialectOptions: {
        //ocketPath: "/var/run/mysqld/mysqld.sock"
    //},
	define: {
	timestamps: false
	},
	//logging: console.log
});
const Department = sequelize.define('department', {
	dept_id: {
		type: Sequelize.INTEGER(11),
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	dept_name: {type: Sequelize.STRING(50), allowNull: false},
	address: Sequelize.STRING,
	city: Sequelize.STRING,
	state: Sequelize.STRING
	},
	{freezeTableName: true} 
	);

const User = sequelize.define('user', {
  user_id:{
    type: Sequelize.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
	allowNull: false
  },
  user_type: {type: Sequelize.STRING(50), allowNull: false},
  email: {type: Sequelize.STRING, allowNull: false},
  password: {type: Sequelize.STRING, allowNull: false},
  first_name: {type: Sequelize.STRING, allowNull: false},
  last_name: {type: Sequelize.STRING, allowNull: false},
  signature_image_path: {type: Sequelize.STRING, allowNull: false},
  account_created: {type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')},
  user_token: Sequelize.STRING(50),
  reset_timer: Sequelize.DATE,
  /*department_id: {
	type: Sequelize.INTEGER(11),
	required: true,
    allowNull: false 
	}*/
}, {
    freezeTableName: true
});

Department.hasMany(User, {foreignKey: 'department_id'});
User.belongsTo(Department, {foreignKey: 'department_id', foreignKeyConstraint: true});
sequelize.sync().then(()=>{
})
/*sequelize.query("SELECT * FROM `user` WHERE `user_id` = 1").then(function (result) {
		console.log(result);
    });*/

module.exports = User;
