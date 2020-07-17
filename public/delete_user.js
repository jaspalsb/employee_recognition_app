function deleteUser(id){
	$.ajax({
		url: "/admin-crud-users/" + id,
		type: "DELETE",
		success: function(resutls){
			window.location.reload(true);
		}
	})
}