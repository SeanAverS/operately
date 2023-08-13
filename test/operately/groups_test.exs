defmodule Operately.GroupsTest do
  use Operately.DataCase

  alias Operately.Groups

  describe "groups" do
    alias Operately.Groups.Group

    import Operately.GroupsFixtures
    import Operately.PeopleFixtures
    import Operately.CompaniesFixtures

    @invalid_attrs %{name: nil}

    test "list_groups/0 returns all groups" do
      group = group_fixture()
      assert Groups.list_groups() == [group]
    end

    test "list_potential_members returns members that are not in the group" do
      company = company_fixture(name: "Acme")
      person1 = person_fixture(full_name: "John Doe", title: "CEO", company_id: company.id)
      person2 = person_fixture(full_name: "Mike Smith", title: "CTO", company_id: company.id)

      group = group_fixture()

      assert Groups.list_potential_members(group.id, "", [], 10) == [person1, person2]
      assert Groups.list_potential_members(group.id, "", [person1.id], 10) == [person2]
      assert Groups.list_potential_members(group.id, "Doe", [], 10) == [person1]
      assert Groups.list_potential_members(group.id, "CTO", [], 10) == [person2]

      {:ok, _} = Groups.add_members(group, [person1.id])

      assert Groups.list_potential_members(group.id, "", [], 10) == [person2]
    end

    test "get_group!/1 returns the group with given id" do
      group = group_fixture()
      assert Groups.get_group!(group.id) == group
    end

    test "create_group/1 with valid data creates a group" do
      valid_attrs = %{name: "some name", mission: "some mission"}

      assert {:ok, %Group{} = group} = Groups.create_group(valid_attrs)
      assert group.name == "some name"
    end

    test "create_group/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Groups.create_group(@invalid_attrs)
    end

    test "update_group/2 with valid data updates the group" do
      group = group_fixture()
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Group{} = group} = Groups.update_group(group, update_attrs)
      assert group.name == "some updated name"
    end

    test "update_group/2 with invalid data returns error changeset" do
      group = group_fixture()
      assert {:error, %Ecto.Changeset{}} = Groups.update_group(group, @invalid_attrs)
      assert group == Groups.get_group!(group.id)
    end

    test "delete_group/1 deletes the group" do
      group = group_fixture()
      assert {:ok, %Group{}} = Groups.delete_group(group)
      assert_raise Ecto.NoResultsError, fn -> Groups.get_group!(group.id) end
    end

    test "change_group/1 returns a group changeset" do
      group = group_fixture()
      assert %Ecto.Changeset{} = Groups.change_group(group)
    end
  end
end
